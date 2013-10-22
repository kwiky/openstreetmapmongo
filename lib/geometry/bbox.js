/* Bounding box
*
* Stefan Wehner (2012)
*/

var util = require("util");
var assert = require("assert");

var Settings = require('../util/settings').getSettings;

exports.BBox = BBox;

exports.TestInterface = {
    injectGridSize: function(grid) {Grid = grid},
}

// gridsize
var Grid = Settings().GRID || 0.2;

function BBox(obj) {
    // Create bounding box for the nodes in the object.
    // obj is a list of [lon,lat]

    this.north = undefined;
    this.south = undefined;
    this.east = undefined;
    this.west = undefined;
    if (obj) {
        if (obj[0][0]) {
            this.includeNodes(obj);
        } else {
            this.includeNode(obj);
        }
    }
}

BBox.prototype.includeNodes = function(nodes) {
    var bbox = this;
    // nodes is a list of [lon,lat]
    for (var i=0; i<nodes.length; i++) {
        bbox.includeNode(nodes[i]);
    }
}

// extend the bounding box to include the node
BBox.prototype.includeNode = function(node) {
    // node is a [lon,lat] pair

    lon = node[0];
    lat = node[1];
    if (!this.south || lat < this.south) {
        this.south = lat;
    }
    if (!this.north || lat > this.north) {
        this.north = lat;
    }
    if (!this.west || lon < this.west) {
        this.west = lon;
    }
    if (!this.east || lon > this.east) {
        this.east = lon;
    }
}

BBox.prototype.isDefined = function() {
    return (this.north != undefined && this.south != undefined && this.east != undefined && this.west != undefined);
}

// return true if box is inside the bounding box
BBox.prototype.isBoxInside = function(box) {
    return 4 == this.cornersInside(box);
}

// return true if box overlaps with bounding box
BBox.prototype.isBoxOverlap = function(box) {
    return this.cornersInside(box) > 0;
}

// count how many corners of box are inside bounding box
BBox.prototype.cornersInside = function(box) {
    var inside = 0;
    var bbox = this;
    box.fourCorners().forEach(function(corner) {
        if (bbox.isInside(corner)) {
            inside++;
        }
    })
    return inside;
}


// return true if node is inside the bounding box
BBox.prototype.isInside = function(node) {
    assert(this.isDefined());
    lon = node[0];
    lat = node[1];
    return (lat <= this.north && lat >= this.south && lon >= this.west && lon <= this.east);
}

// returns all four corners bounding box
// TODO: replace with parallelogram
BBox.prototype.fourCorners = function() {
    assert(this.isDefined());
    return [[this.west,this.south],[this.west,this.north],[this.east,this.north],[this.east,this.south]];
}

// returns bounding box left,bottom,right,top
BBox.prototype.bbox = function() {
    assert(this.isDefined());
    return [[this.west,this.south],[this.east,this.north]];
}

BBox.prototype.toString = function() {
    return util.format("(W %f, S %f),(E %f, N %f)",this.west,this.south,this.east,this.north);
}

BBox.prototype.hash = function() {
    assert(this.isDefined());
    return this.west+"#"+this.south+"#"+this.east+"#"+this.north;
}
// round down to the next grid point
function roundUpToGrid(deg) {
    return Math.ceil(deg/Grid)*Grid;
}

// round up to the next grid point
function roundDownToGrid(deg) {
    return Math.floor(deg/Grid)*Grid;
}

// inflate bounding box to fit to the next grid line
// (round up/down to the next third decimal)
// return bbox
BBox.prototype.inflateToNextGridLine = function() {
    assert(this.isDefined());
    this.west = roundDownToGrid(this.west);
    this.south = roundDownToGrid(this.south);
    this.north = roundUpToGrid(this.north);
    this.east = roundUpToGrid(this.east);

    return this;
}

// Divide BBox object into a micro degree raster of bboxes and call callback
// function with those bbox tiles one by one untile the parent BBox is covered.
BBox.prototype.forEachGridBBox = function(callback) {
    // instantiate copy
    var bbox = new BBox(this.bbox()).inflateToNextGridLine();
    if (bbox.west == bbox.east && bbox.south == bbox.north) {
        // single point box shall retrieve one grid box
        bbox.east = bbox.west + Grid/2;
        bbox.north = bbox.south + Grid/2;
    }
    for (var x=bbox.west; bbox.east-x > 1e-6; x += Grid) {
        for (var y=bbox.south; bbox.north-y > 1e-6; y += Grid) {
            callback(new BBox([[x,y],[x+Grid,y+Grid]]));
        }
    }
}

