/**
* Tests for BBox (bounding box)
*
* Stefan Wehner 2012
*/

var BBox = require('../lib').BBox;
var TestInterface = require('../lib/geometry/bbox').TestInterface;

exports.makeBox = function(test) {
    var box = new BBox([1,1]);

    test.equals(1, box.north);
    test.equals(1, box.east);
    test.equals(1, box.south);
    test.equals(1, box.west);
    test.done();
}


exports.undefinedBox = function(test) {
    var box = new BBox();

    test.ok(!box.isDefined());
    // TODO make work test.throws(box.isInside([1,1]));
    test.done();
}

exports.returnBBox = function(test) {
    var box = new BBox([[3,4],[1,2]]);

    // left,bottom,right,top
    test.deepEqual(box.bbox(),[[1,2],[3,4]]);
    test.done();
}

exports.returnFourCorners = function(test) {
    var box = new BBox([[3,4],[1,2]]);

    test.deepEqual(box.fourCorners(),[[1,2],[1,4],[3,4],[3,2]]);
    test.done();
}

exports.testsWithStandardBox = {
    setUp: function(callback) {
        this.bbox = new BBox([[1,1],[2,2]])
        callback();
    },
    tearDown: function(callback) {
        // clean up
        callback();
    },
    isInsideBox: function(test) {
        test.ok(this.bbox.isInside([1.5,1.5]));
        test.done();
    },
    isOutsideBox: function(test) {
        test.ok(!this.bbox.isInside([1.5,2.5]));
        test.done();
    },
    boxesOverlap: function(test) {
        var box = new BBox([[1,1],[3,3]]);
        test.ok(this.bbox.isBoxOverlap(box));
        test.ok(!this.bbox.isBoxInside(box));
        test.done();
    },
    boxesNotOverlap: function(test) {
        var box = new BBox([[3,3],[4,4]]);
        test.ok(!this.bbox.isBoxOverlap(box));
        test.done();
    },
    boxesNotInside: function(test) {
        var box = new BBox([[3,3],[4,4]]);
        test.ok(!this.bbox.isBoxInside(box));
        test.done();
    },
    boxInside: function(test) {
        var box = new BBox([[1.1,1.1],[2,1.8]]);
        test.ok(this.bbox.isBoxInside(box));
        test.done();
    },
    expandBox: function(test) {
        this.bbox.includeNode([3,3]);

        test.ok(this.bbox.isInside([3,3]));
        test.done();
    },
    inflateBox: function(test) {
        // stays the same
        test.deepEqual(this.bbox.bbox(), this.bbox.inflateToNextGridLine().bbox());
        test.done();
    },
    returnTiles: function(test) {
        var tile_counter = 0;

        this.bbox.forEachGridBBox(function(bb) {
            tile_counter++;
        });
        test.equals(25,tile_counter);
        test.done();
    }
};

exports.inflateOddBox = function(test) {
    var box = new BBox([[1.11111,2.22222],[3.444,5.55555]]);
    TestInterface.injectGridSize(0.002);

    test.deepEqual([[1.110,2.222],[3.444,5.556]],box.inflateToNextGridLine().bbox());
    test.done();
}

exports.inflateSinglePointBox = function(test) {
    var box = new BBox([[1,2],[1,2]]);

    test.deepEqual([[1,2],[1,2]],box.inflateToNextGridLine().bbox());
    test.done();
}

exports.singleTile = function(test) {
    var box = new BBox([[1,2],[1.000001,2.000001]]);
    var tile_counter = 0;

    box.forEachGridBBox(function(bb) {
        tile_counter++;
    });
    test.equals(1,tile_counter);
    test.done();
}

exports.singlePointTile = function(test) {
    var box = new BBox([[1,2],[1,2]]);
    var tile_counter = 0;

    box.forEachGridBBox(function(bb) {
        tile_counter++;
    });
    test.equals(1,tile_counter);
    test.done();
}


