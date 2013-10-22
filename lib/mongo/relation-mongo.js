/*
* Store relations in MongoDb
*
* Stefan Wehner (2012)
*/

var Mongojs = require('mongodb');
var assert = require('assert');

var DB = require("../mongo/mongo-connect");

var Way = require("../geometry/way").Way;
var Relation = require("../geometry/relation").Relation;
var NodeTmpDB = require("../mongo/tmp-node-mongo");

exports.TestInterface = {
    injectTmpNodesDB: function(mock) {NodeTmpDB = mock;},
    injectDB: function(mock) {DB = mock}
}

exports.storeRelation = function(relation, decrDBQueue, missingWay) {
    var dots = [];
    var outstanding_nodes = 0;
    // loop over all nodes for all roles
    for (role in relation.nodes) {
        if (relation.nodes.hasOwnProperty(role)) {
            relation.nodes[role].forEach(function(node) {
                outstanding_nodes++;
                NodeTmpDB.getNode(Mongojs.Long(node.osm_id), function(error, nd) {
                    if (error) {
                        throw new Error("Error reading node: "+node.osm_id+" "+error);
                    }
                    if (!nd) {
                        // as below for ways, we may consider calling a missingNode callback here
                        outstanding_nodes--;
                    } else {
                        dots.push(nd.loc);
                        var q_node = {'_id': {osm: Mongojs.Long(nd._id)}};
                        var nodedata = {
                            $set: {type: 'n', loc: nd.loc},
                            $addToSet: {rel: {id: Mongojs.Long(relation.osm_id), r: role}}
                        }
                        DB.getCollection('osm').findAndModify(q_node, [], nodedata, {safe: true, upsert: true}, function(error,result) {
                            if (error) {
                                throw new Error("Could not update node: "+node.osm_id+" "+error);
                            }
                            outstanding_nodes--;
                        })
                    }
                })
            })
        }
    }

    // update reference to relation in ways already stored in database
    var outstanding_ways = 0;
    // loop over all ways for all roles
    for (role in relation.ways) {
        if (relation.ways.hasOwnProperty(role)) {
            relation.ways[role].forEach(function(way) {
                outstanding_ways++;
                var q_way = {_id: {osm: Mongojs.Long(way.osm_id), seg: 0}};
                var data = {$addToSet: {rel: {id: Mongojs.Long(relation.osm_id), r: role}}};
                DB.getCollection('osm').findAndModify(q_way, [], data, {safe: true}, function(error,result) {
                    if (error) {
                        throw new Error("Could not update way: "+way.osm_id+" "+error);
                    }
                    if (result && result.loc) {
                        dots = dots.concat(result.loc);
                        outstanding_ways--;
                    } else {
                        // not all relation members may be included in the input file
                        // store segment-0 dataset to have the reference to the relation but give it
                        // version -1 so that it will be updated as soon as the way data is loaded
                        data["$set"] = {v: -1, type: 'w'};
                        DB.getCollection('osm').findAndModify(q_way, [], data, {safe: true, upsert: true}, function(error,result) {
                            assert.equal(null,error);
                            outstanding_ways--;
                        })
                        missingWay(way.osm_id);
                    }
                })
            })
        }
    }

    function storeRelationWithDotsCB() {
        if (outstanding_ways || outstanding_nodes) {
            // still waiting for the bbox to be completed
            setTimeout(storeRelationWithDotsCB,30);
            return;
        }
        // store relation itself with location dots for all members
        var q_rel = {_id: {osm: Mongojs.Long(relation.osm_id)}};
        var reldata = {$set: {v: relation.version, type: 'r'
                      , tags: relation.attrs}
                  }
        // relations without any downloaded data don't have a bbox
        reldata["$set"]["loc"] = dots;
        DB.getCollection('osm').update(q_rel, reldata, {upsert: true, safe: true}, function(error) {
            if (error) {
                throw new Error("Could not update/insert relation: "+relation.osm_id+" "+error);
            }
            decrDBQueue();
        });
    }

    // wait for all ways belonging to the relation to be updated and have returned their location
    setTimeout(storeRelationWithDotsCB,30);
}


