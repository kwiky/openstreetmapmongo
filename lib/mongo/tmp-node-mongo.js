/*
* Store nodes temporarily in mongo
*
* Stefan Wehner (2012)
*/

var DB = require("../mongo/mongo-connect");
var Settings = require('../util/settings').getSettings;

var Node = require("../geometry/node").Node;

var NODE_TMP_COLLECTION = Settings().NODE_TMP_COLLECTION || 'tmp_nodes';

exports.add = function(node) {
    var nodedata = {_id: node.osm_id, loc: [node.lon,node.lat]};
    DB.getCollection(NODE_TMP_COLLECTION).insert(nodedata);
}

exports.TestInterface = {
    injectDB: function(mock) {DB = mock}
}

// node_ids is a list of node id's. Returns an array with the lon,lat pairs
exports.getLocations = function(node_ids, callback) {
    var loc = [];
    getNodes(node_ids, function(error,nodes) {
        if (!error) {
            var missing = [];
            node_ids.forEach(function(id) {
                if (!nodes[id]) {
                    missing.push(id);
                }
                loc.push(nodes[id]);
            })
            if (missing.length) {
                error = missing.join();
            }
        }
        callback(error,loc);
    })
}

exports.getNodes = getNodes;

function getNodes(node_ids, callback) {
    var query = {_id: {$in: node_ids}};
    DB.getCollection(NODE_TMP_COLLECTION).find(query, function(error, result) {
        result.toArray(function(err,nodes) {
            // convert to dictionary
            nodes_dic = {};
            nodes.forEach(function(nd) {
                nodes_dic[nd._id] = nd.loc;
            })
            callback(err,nodes_dic);
        })
    });
}

exports.getNode = getNode;

function getNode(node_id, callback) {
    var query = {_id: node_id};
    DB.getCollection(NODE_TMP_COLLECTION).findOne(query, function(error, node) {
        callback(error, node);
    });
}

exports.drop = function() {
    DB.getCollection(NODE_TMP_COLLECTION).drop();
}

