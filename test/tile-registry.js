/*
* Tests for TileRegistry
*
* Stefan Wehner (2012)
*/

var TileRegistry = require('../lib').TileRegistry;
var BBox = require('../lib').BBox;

exports.TileRegistryEmpty = function(test) {
    var myUrl = "http://parsnip.com",
    tr = new TileRegistry(myUrl);

    test.equals(0, tr.getMongoEntry().length);
    test.done();
}

exports.TileRegistryDatawithTimestamp = function(test) {
    var myUrl = "http://parsnip.com",
    tr = new TileRegistry(myUrl);
    tr.updateElementBBox(new BBox([[1,1],[1,1]]));
    tr.updateTimestamp(new Date(2012,1,1));

    test.equals(1, tr.getMongoEntry().length);
    test.deepEqual(new Date(2012,1,1), tr.getMongoEntry()[0].data_timestamp);
    test.done();
}

exports.tileRegistryBBox_NoBBox = function(test) {
    tr = new TileRegistry("xxx");
    tr.updateElementBBox(new BBox([[1,1],[1.003,1.003]]));
    test.equals(4, tr.getMongoEntry().length);
    test.equals("xxx", tr.getMongoEntry()[0]['_id'].url);
    test.ok(new Date() >= tr.getMongoEntry()[0].read_timestamp);
    test.done();
}

exports.tileRegistryBBox_OffBbox = function(test) {
    tr = new TileRegistry("xxx");
    tr.setBBox(new BBox([[3,4],[4,4]]));
    tr.updateElementBBox(new BBox([[1,1],[1.003,1.003]]));
    test.equals(0, tr.getMongoEntry().length);
    test.done();
}

exports.tileRegistryBBox_OverlapBbox = function(test) {
    tr = new TileRegistry("xxx");
    tr.setBBox(new BBox([[1,1],[1.0001,1.0001]]));
    tr.updateElementBBox(new BBox([[1,1],[1.003,1.003]]));
    test.equals(1, tr.getMongoEntry().length);
    test.done();
}

exports.tileRegistryBBox_insideBbox = function(test) {
    tr = new TileRegistry("xxx");
    tr.setBBox(new BBox([[1,1],[2,2]]));
    tr.updateElementBBox(new BBox([[1,1],[1.003,1.003]]));
    test.equals(4, tr.getMongoEntry().length);
    test.done();
}

exports.TileRegistryNoBox = function(test) {
    tr = new TileRegistry("xxx");

    test.equals(undefined, tr.getMongoEntry().minlon);
    test.done();
}

