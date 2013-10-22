/*
* Keep track of downloaded or file-read data tiles
*
* Stefan Wehner (2012)
*/


var DB = require("../mongo/mongo-connect");
var BBox = require("../geometry/bbox").BBox;

var Mongojs = require('mongodb');

exports.TileRegistry = TileRegistry;

function TileRegistry(url) {
    this.url = url;
    this.tiles = {};
    this.bbox = undefined;
    this.read_timestamp = new Date();
    this.data_timestamp = new Date(1990,1,1);
}

// set primary bbox for the whole data. Nothing will be registered outside this box
TileRegistry.prototype.setBBox = function(bbox) {
    this.bbox = bbox;
}

// update latest date in data
TileRegistry.prototype.updateTimestamp = function(date) {
    if (this.data_timestamp < date) {
        this.data_timestamp = date;
    }
}

// call for each way and node with the element's bbox and date
TileRegistry.prototype.updateElementBBox = function(box) {
    var bbox = this.bbox;
    var tiles = this.tiles;
    new BBox(box.bbox()).inflateToNextGridLine().forEachGridBBox(function(bb) {
        // check that new tile box is inside the overall box (if defined)
        if (!bbox || bbox.isBoxOverlap(bb)) {
            // update existing box or add new one to the tiles object
            if (!tiles[bb.hash()]) {
                tiles[bb.hash()] = bb;
            }
        }
    });
}

// return a batch of tiles ready to be stored in MongoDB
TileRegistry.prototype.getMongoEntry = function() {
    var data = [];
    var tiles = this.tiles;
    for (var b in tiles) {
        if (tiles.hasOwnProperty(b)) {
            var bb = tiles[b];
            data.push({_id: {url: this.url
                          , loc: [bb.west,bb.south]
                        }
                        , read_timestamp: this.read_timestamp
                        , data_timestamp: this.data_timestamp  // latest data
                      })
        }
    }
    return data;
}

