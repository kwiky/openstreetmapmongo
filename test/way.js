/**
* Test functions for Way object
* Stefan Wehner 2012
*/

var Way = require('../lib').Way;
var Node = require('../lib').Node;
var BBox = require("../lib").BBox;

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
    checkBBox: function(test) {
        this.way.setCoordinates(this.coords);
        var bbox = new BBox([[-76,33],[-75,34]]);
        test.ok(bbox.isBoxInside(this.way.bbox));
        test.done();
    },
    wrongNumberOfCoordinates: function(test) {
        this.coords.pop();
        function tooFewCoordinates() {
            this.way.setCoordinates(this.coords)
        }
        test.throws(tooFewCoordinates, Error, "Caught wrong number of coords.");
        test.done();
    },
    wayLength: function(test) {
        this.way.setCoordinates(this.coords);
        test.ok(0.1 < Math.abs(53565723.017 - this.way.getLengthMeters()));
        test.done();
    }
};


exports.wayNotPolygon = function(test) {
    var way = new Way(33,1,true);
    way.nodes = [1,2,3];

    test.equals(false, way.isPolygon(way));
    test.done();
}

exports.wayIsPolygon = function(test) {
    var way = new Way(33,1,true);
    way.nodes = [1,2,1];

    test.ok(way.isPolygon(way));
    test.done();
}

exports.wayIsCoordinatePolygon = function(test) {
    var way = new Way(33);
    way.setCoordinates([[1,1],[2,2],[1,1.000000001]]);

    test.equals(true, way.isPolygon(way));
    test.done();
}

exports.wayNotCoordinatePolygon = function(test) {
    var way = new Way(33);
    way.setCoordinates([[1,1],[2,2],[1,1.00001]]);

    test.equals(false, way.isPolygon(way));
    test.done();
}
