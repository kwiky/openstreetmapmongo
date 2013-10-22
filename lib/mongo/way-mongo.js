/*
* Store ways in MongoDb
*
* Stefan Wehner (2012)
*/
var assert = require("assert");

var DB = require("../mongo/mongo-connect");
var Nodes = require("../mongo/tmp-node-mongo");
var logger = require("../util/logger");

var Way = require("../geometry/way").Way;

exports.TestInterface = {
    injectDB: function(mock) {DB = mock},
    injectNodes: function(mock) {Nodes = mock}
}

// Store way in MongoDb. Each way is stored as at least two documents
// 1: The way-metadata, like version, tags, type. Indexed by {_id.osm: way.osm_id}
// 2..n: One or more way segments, depending on the length of the way.
//       Segments contain the nodes [[lon,lat],..]
//       Indexed by {_id: {osm: osm_id, seg: sementCounter}}
exports.storeWay = function(way, decrDBQueue, elementCB) {
    Nodes.getLocations(way.nodes, function(error, loc) {
        if (error != null) {
            logger.warning("Could not get (all) nodes for way: "+way.osm_id, error);
            decrDBQueue();
            return;
        }
        way.setCoordinates(loc);
        elementCB({elementBBox: way.bbox});

        // findAndModify (or insert) reference element
        var waydata = {"$set": {
                                  loc: way.getScarceWay()
                                , v: way.version
                                , type: way.isPolygon() ? 'p' : 'w'
                                , tags: way.attrs
                                }
                      };
        DB.getCollection('osm').findAndModify({_id: {osm: way.osm_id, seg: 0}}
                            , [], waydata
                            , {upsert: true, safe: true}
                            , function(error,found) {
            if (error) {
                throw new Error("Failed to update/insert way "+way.osm_id+" "+error);
            }
            if (!found._id || found.v < way.version) {
                var segments = exports.waySegments(way, 60);
                if (found._id) {
                    // way needs update. remove existing segments in DB
                    DB.getCollection('osm').remove({"_id.osm": way.osm_id, "_id.seg": {$gt: 0}}, {safe: true}, function(error) {
                        if (error) {
                            throw new Error("Could not remove existing segments for way: "+way.osm_id+" "+error);
                        }
                        wayInsert(segments,decrDBQueue);
                    });
                } else {
                    // way is entirely new
                    wayInsert(segments,decrDBQueue);
                }
            } else {
                // way doesn't need update
                decrDBQueue();
            }
        });
    });

}

// helper function for inserting a way
function wayInsert(waydata, decrDBQueue) {
    DB.getCollection('osm').insert(waydata, {safe: true}, function(error) {
        if (error) {
            throw new Error("Could not insert segments for way: "+waydata[0]["_id"]["osm"]+" "+error);
        }
        decrDBQueue();
    });
}


// Split way to segments with max. segment_size nodes per segment
// return an array of way segments ready to instert to mongo DB
exports.waySegments = function(way, segment_size) {
    assert(way.coordinates, "Set coordinates first.")

    ln = way.coordinates.length;
    // split into almost equally sized segments
    var sn = Math.ceil(ln / Math.ceil(ln / segment_size));
    var res = [];
    for (var i=0; i<ln; i+=sn) {
        // segment counting starts at 1 (seg 0 is the way metadata)
        mongoway = {_id: {osm: way.osm_id, seg: i+1}, nd: way.coordinates.slice(i,i+sn)};
        res.push(mongoway);
    }
    return res;
}




