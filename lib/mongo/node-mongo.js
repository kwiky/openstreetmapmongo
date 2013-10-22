/*
* Store nodes in MongoDb
*
* Stefan Wehner (2012)
*/

var Mongojs = require('mongodb');

var DB = require("../mongo/mongo-connect");

var BBox = require("../geometry/bbox").BBox;
var Way = require("../geometry/way").Way;
var Node = require("../geometry/node").Node;

exports.storeNode = function(node, decrDBQueue) {
    var nodedata = {$set: {v: node.version, type: 'n', tags: node.attrs, loc: [node.lon,node.lat]}};
    if (node.rel) {
        nodedata["$addToSet"] = {rel: {$each: node.rel}};
    }
    var q_node = {"_id": {"osm": node.osm_id}};
    DB.getCollection('osm').update(q_node, nodedata, {upsert: true, safe: true}, function(error,data) {
        if (error) {
            throw new Error("Could not update/insert node: "+node.osm_id+" "+error);
        }
        decrDBQueue();
    })
}


