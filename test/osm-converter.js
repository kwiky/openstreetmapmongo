/**
* Test functions for osm mongo data to osm converter
*
* Stefan Wehner (2012)
*/

var util = require("util");

var OsmConverter = require('../lib/access/osm-converter');

var Collection = {
    find: function() {
        return this;
    },
    toArray: function(callback) {
        callback('Test-Error', null);
    }
}

exports.convert = {
    setUp: function(cb) {
        cb();
    },
    convertNode: function(test) {
        function callback(error, result) {
            test.equal(null, error);
            test.equal(1, result.nodes.length);
            test.equal(0, result.relations.length);
            test.equal(0, result.ways.length);
            test.equal(1357153942, result.nodes[0].osm_id);
            test.equal('Miraflores', result.nodes[0].attrs.name);
            test.done();
        }
        var data = [{ "_id" : { "osm" : 1357153942 }, "loc" : [ -73.076, -36.811 ], "tags" : { "name" : "Miraflores", "place" : "village" }, "type" : "n", "v" : 1 }];

        OsmConverter.convertToOsm(null, data, callback);
    },
    wayWithError: function(test) {
        function callback(error, result) {
            test.equal('Test-Error', error);
            test.done();
        }

        var data = [{ "_id" : { "osm" : 13 }, loc: [[1,1],[1,2],[2,1],[2,2]], type: 'w'}]
        OsmConverter.convertToOsm(Collection, data, callback);
    },
    avoidDuplicates: function(test) {
        function callback(error, result) {
            test.equal(null, error);
            test.equal(2, result.nodes.length);
            test.equal(0, result.relations.length);
            test.equal(0, result.ways.length);
            test.equal(13, result.nodes[0].osm_id);
            test.equal(15, result.nodes[1].osm_id);
            test.equal('Miraflores', result.nodes[0].attrs.name);
            test.done();
        }
        var data = [{ "_id" : { "osm" : 13 }, "loc" : [ -73.077, -36.811 ], "tags" : { "name" : "Miraflores", "place" : "village" }, "type" : "n", "v" : 1 }
            , { "_id" : { "osm" : 13 }, "loc" : [ -73.076, -36.811 ], "tags" : { "name" : "Miraflores", "place" : "village" }, "type" : "n", "v" : 1 }
            , { "_id" : { "osm" : 15 }, "loc" : [ -73.076, -36.999 ], "tags" : { "name" : "Miraflores", "place" : "village" }, "type" : "n", "v" : 1 }
            ];

        OsmConverter.convertToOsm(null, data, callback);
    }
}
