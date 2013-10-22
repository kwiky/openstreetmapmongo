/*
* Test cases for relation converter
*
* Stefan Wehner (2012)
*/

var Node = require('../lib').Node;
var Way = require('../lib').Way;
var Relation = require('../lib').Relation;

var RelationConverter = require('../lib').RelationConverter;

exports.relationWithNothing = function(test) {
    var collection = {
        find: function(query, sort) {
            test.equal(333, query["rel.id"]);
            return this;
        },
        toArray: function(callback) {
            // this relation has no members
            callback(null, []);
        }
    }
    function callback(error, relation) {
        test.equal(333, relation.osm_id);
        test.equal(2, relation.version);
        test.deepEqual({nature: "boulders"}, relation.attrs);
        test.deepEqual({}, relation.ways);
        test.deepEqual({}, relation.nodes);
        test.done();
    }
    var mongo_relation = {_id: {osm: 333}, v: 2, tags: {nature: "boulders"}};
    var rcon = new RelationConverter(collection, mongo_relation, callback);
}

exports.relationWithNode = function(test) {
    var node_result = {
        toArray: function(callback) {
            var res = [{_id: {osm: 123}, loc: [1,2], type: 'n', rel: [{id: 333, r: 'relnode'}]}];
            process.nextTick(function() {callback(null, res)});
        }
    }
    var collection = {
        find: function(query, sort) {
            if (333 == query["rel.id"]) {
                // query for relation members. Return a node.
                return node_result;
            };
        },
    }
    function callback(error, relation) {
        test.equal(null, error);
        test.deepEqual(123, relation.nodes['relnode'][0].osm_id);
        test.done();
    }
    var mongo_relation = {_id: {osm: 333}};
    var rcon = new RelationConverter(collection, mongo_relation, callback);
}

exports.relationWithWay = function(test) {
    var way_result = {
        toArray: function(callback) {
            var res = [ {_id: {osm: 456}, loc: [[1,2],[4,5]], type: 'w', rel: [{id: 444, r: 'outer'}]},
                        {_id: {osm: 789}, loc: [[6,2],[8,5]], type: 'w', rel: [{id: 22, r: 'inner'}, {id: 444, r: 'outer'}]}
                      ];
            process.nextTick(function() {callback(null, res)});
        }
    }
    var way456 = {
        toArray: function(callback) {
            var res = [ {_id: {osm: 456, seg: 1}, nd: [[6,7],[5,6],[4,4]]} ];
            process.nextTick(function() {callback(null, res)});
        }
    }
    var way789 = {
        toArray: function(callback) {
            var res = [ {_id: {osm: 789, seg: 1}, nd: [[4,4],[4.5,6],[6.5,7.1]]} ];
            process.nextTick(function() {callback(null, res)});
        }
    }
    var collection = {
        find: function(query, sort) {
            if (444 == query["rel.id"]) {
                // query for relation members. Return ways.
                return way_result;
            }
            // query for way segments
            if (456 == query["_id.osm"]) {
                return way456;
            }
            if (789 == query["_id.osm"]) {
                return way789;
            }
        },
    }
    function callback(error, relation) {
        test.equal(null, error);
        test.deepEqual([ [ 6, 7 ], [ 5, 6 ], [ 4, 4 ], [ 4.5, 6 ], [ 6.5, 7.1 ] ], relation.ways['outer'][0].coordinates);
        test.done();
    }
    var mongo_relation = {_id: {osm: 444}};
    var rcon = new RelationConverter(collection, mongo_relation, callback);
}

