/**
* Test functions for storing a way in mongo
*
* Stefan Wehner 2012
*/

var util = require("util");
var events = require("events");

var BBox = require('../lib').BBox;
var Way = require('../lib').Way;
var WayDb = require('../lib').WayDb;

// mock temp node storage
var Nodes;

var TmpNodes = {
    getLocations: function(ids, callback) {
        callback(null, Nodes);
    }
}

var Collection = {};

var Mongo = {
    getCollection: function() {return Collection;}
}

var Registry = function() {}


exports.storeWay = {
    setUp: function(callback) {
        this.way = new Way(111, 2, true);
        WayDb.TestInterface.injectNodes(TmpNodes);
        WayDb.TestInterface.injectDB(Mongo);
        callback();
    },
    insertShortWay: function(test) {
        test.expect(3);
        Nodes = [{lon: 1, lat: 1},
                {lon: 2, lat: 2},
                {lon: 3, lat: 3}];
        this.way.addNodeId(1);
        this.way.addNodeId(2);
        this.way.addNodeId(3);
        Collection.findAndModify = function(query,sort,data,options,cb) {
            test.equals(111, query._id.osm);
            cb(null, {});
        };
        Collection.insert = function(data, options, cb) {
            test.equals(1,data.length);
            test.equals(3,data[0].nd.length);
            test.done();
        };
        WayDb.storeWay(this.way, function() {}, Registry);
    },
    updateExistingWay: function(test) {
        test.expect(4);
        Nodes = [{lon: 1, lat: 1},
                {lon: 2, lat: 2},
                {lon: 3, lat: 3}];
        this.way.addNodeId(1);
        this.way.addNodeId(2);
        this.way.addNodeId(3);
        Collection.findAndModify = function(query,sort,data,options,cb) {
            test.equals(111, query._id.osm);
            cb(null, {_id: 111, v:1});
        };
        Collection.remove = function(query, options, cb) {
            test.equals(111, query['_id.osm']);
            cb(null);
        };
        Collection.insert = function(data, options, cb) {
            test.equals(1,data.length);
            test.equals(3,data[0].nd.length);
            test.done();
        };
        WayDb.storeWay(this.way, function() {}, Registry);
    }
}

exports.waySegments = {
    setUp: function (callback) {
        this.way = new Way(33,1,true);
        // create coordinate pairs and attach them to the way
        this.coords = [];
        for (var i=0; i<1000; i++) {
            this.way.addNodeId(i);
            this.coords.push([Math.random()-76,Math.random()+33]);
        }
        callback();
    },
    tearDown: function (callback) {
        // clean up
        callback();
    },
    buildWaySegments: function (test) {
        var segment_size = 28;
        this.way.setCoordinates(this.coords);
        var segments = WayDb.waySegments(this.way, segment_size);

        // number of segments
        test.equals(segments.length, Math.ceil(this.way.nodes.length/(segment_size)));
        // segment numbering starts at 1
        test.equals(1,segments[0]['_id']['seg']);
        // correct way id
        test.equals(this.way.osm_id,segments[0]['_id']['osm']);
        test.done();
    }
}
