/**
* Create singleton instance per osm database.
*
* Stefan Wehner 2012
*/

var Mongojs = require('mongodb');

var MongoOsm = require('../mongo/mongo-connect');
var logger = require('../util/logger');
var Settings = require('../util/settings').getSettings();
var OsmConverter = require('./osm-converter');

var OsmDb = {};

var EarthRadius = 6378 // km


exports.OsmComplete = function(mongo_host, mongo_port) {
    if (!OsmDb.hasOwnProperty(mongo_host+mongo_port)) {
        OsmDb[mongo_host+mongo_port] = new OsmComplete(mongo_host, mongo_port);
    }
    return OsmDb[mongo_host+mongo_port];
}

exports.TestInterface = {
    injectMongoDb: function(mock) {MongoOsm = mock;},
    injectLogger: function(mock) {logger = mock;},
    injectOsmConverter: function(mock) {OsmConverter = mock;},
    tagsPrefix: tagsPrefix
}

function OsmComplete(mongo_host, mongo_port) {
    this.host = mongo_host;
    this.port = mongo_port;
    this.collection = undefined;
    this.queued = [];
    var context = this;

    function connectedCb(error) {
        if (error) {
            throw new Error("Could not connect to Mongo: "+error);
        }
        context.collection = MongoOsm.getCollection(Settings.OSM_COLLECTION);
        context.callEnqueued(context.collection);
    }

    MongoOsm.connect(mongo_host, mongo_port, connectedCb);
}

OsmComplete.prototype.findOsm = function(tags, callback) {
    logger.debug("OsmComplete.findOsm", tags);
    var query = tagsPrefix(tags);
    var context = this;
    this.callWhenReady( function(collection) {find(context.collection, query, callback)} );
}

OsmComplete.prototype.findOsmNear = function(loc, distance_km, tags, callback) {
    logger.debug("OsmComplete.findOsmNear loc="+loc+" distance="+distance_km+"km", tags);

    function osmGeoNear(collection, query, callback) {
        var options = {
            query: query,
            spherical: true,
            maxDistance: distance_km / EarthRadius,
            uniqueDocs: true
        }
        collection.geoNear(loc[0], loc[1], options, function(error, result) {
            if (error) {
                callback("Failed to execute query <"+query+"> Error: "+error);
            }
            var osm = [];
            result.results.forEach(function(res) {
                osm.push(res.obj);
            });
            OsmConverter.convertToOsm(collection, osm, callback);
        });
    }

    var context = this;
    this.callWhenReady( function(collection) {osmGeoNear(context.collection, tagsPrefix(tags), callback)} );
}

OsmComplete.prototype.findOsmBox = function(bbox, tags, callback) {
    logger.debug("OsmComplete.findOsmBox bbox="+bbox, tags);
    var query = tagsPrefix(tags);
    query.loc = {$within: {$box: bbox.bbox()}};
    var context = this;
    this.callWhenReady( function(collection) {find(context.collection, query, callback)} );
}

OsmComplete.prototype.findOsmPolygon = function(polygon, tags, callback) {
    logger.debug("OsmComplete.findOsmPolygon polygon=", {polygon: polygon, tags: tags});
    var query = tagsPrefix(tags);
    query.loc = {$within: {$polygon: polygon}};
    var context = this;
    this.callWhenReady( function(collection) {find(context.collection, query, callback)} );
}

// queue up Db calls in case DB connection is not established
OsmComplete.prototype.callWhenReady = function(dbfind) {
    this.queued.push( dbfind );
    if (this.collection) {
        this.callEnqueued();
    }
}

// call enqueued DB requests
OsmComplete.prototype.callEnqueued = function() {
    while (this.queued.length) {
        this.queued.pop()(this.collection);
    }
}


function find(collection, query, callback) {
    collection.find(query).toArray(function(error, result) {
        if (error) {
            callback("Failed to execute query <"+query+"> Error: "+error);
        }
        OsmConverter.convertToOsm(collection, result, callback);
    });
}


// prefix property names with 'tags.' as so they are named in the DB
function tagsPrefix(user_query) {
    var query = {};
    for (var tag in user_query) {
        if (tag.slice(0,1) != '$') {
            query["tags."+tag] = user_query[tag];
        } else {
            query[tag] =  user_query[tag];
        }
    };
    return query;
}
