/**
* Test functions for storing a relation in mongo
*
* Stefan Wehner 2012
*/

var util = require("util");
var events = require("events");
var Mongojs = require('mongodb');

var BBox = require('../lib').BBox;
var Node = require('../lib').Node;
var Way = require('../lib').Way;
var Relation = require("../lib").Relation;
var RelationDb = require('../lib').RelationDb;

// mock temp node storage
var TmpNodes = {}

var Collection = {};

var Mongo = {
    getCollection: function() {return Collection;}
}

var Registry = function() {}


exports.storeRelation = {
    setUp: function(callback) {
        RelationDb.TestInterface.injectTmpNodesDB(TmpNodes);
        RelationDb.TestInterface.injectDB(Mongo);
        callback();
    },
    nodesOnly: function(test) {
        test.expect(5);
        var relation = new Relation(1,1,true);
        relation.addNodeMember('', new Node(10));
        relation.addNodeMember('', new Node(20));
        relation.addNodeMember('', new Node(30));
        TmpNodes.getNode = function(id, callback) {
            node = {_id: id, loc: [id/10,id/10]};
            callback(null, node);
        }
        Collection.findAndModify = function(query,sort,data,options,cb) {
            test.ok([10,20,30].indexOf(query._id.osm.toInt()) >= 0);
            cb(null, {});
        };
        Collection.update = function(query, reldata, options, cb) {
            test.deepEqual([[1,1],[2,2],[3,3]],reldata['$set'].loc);
            test.equals(1,query._id.osm);
            cb(null);
            test.done();
        };
        RelationDb.storeRelation(relation, function() {}, null, Registry);
    },
    waysOnly: function(test) {
        test.expect(20);
        var relation = new Relation(111,1,true);
        relation.addWayMember('outer', new Way(11));
        relation.addWayMember('outer', new Way(22));
        relation.addWayMember('outer', new Way(33));
        function missingWay(id) {
            test.equal(33,id);
        }
        Collection.update = function(query, reldata, options, cb) {
            test.deepEqual([ [ 33, 44 ], [ 34, 45 ], [ 33, 44 ], [ 34, 45 ] ],reldata['$set'].loc);
            test.equals(111,query._id.osm);
            cb(null);
            test.done();
        };
        Collection.findAndModify = function(query,sort,data,options,cb) {
            test.ok([11,22,33].indexOf(query._id.osm.toInt()) >= 0);
            test.equal(0, query._id.seg);
            test.deepEqual([], sort);
            test.deepEqual({rel: {id: Mongojs.Long(111), r: 'outer'}}, data['$addToSet']);
            if (data['$set']) {
                // second findAndModify: insert new way document
                test.deepEqual({v: -1, type: 'w'}, data['$set']);
                cb(null, {});
          } else {
                // first findAndModify: add relation to way document
                if (query._id.osm.toInt() == 33) {
                    // simulate missing way
                    cb(null, undefined);
                } else {
                    cb(null, {loc: [[33,44],[34,45]]});
                }
            }
        };
        RelationDb.storeRelation(relation, function() {}, missingWay, Registry);
    }
}
