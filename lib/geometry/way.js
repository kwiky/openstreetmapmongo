/* OSM way object
*
* Stefan Wehner (2012)
*/

var assert = require("assert");
var BBox = require("./bbox").BBox;
var geomath = require("./geomath");

exports.Way = Way;

function Way(osm_id, version, visible) {
    this.visible = visible;
    this.nodes = undefined;
    this.osm_id = osm_id;
    this.version = version;
    this.attrs = undefined;
    this.coordinates = undefined;
    this.bbox = undefined;
}

Way.prototype.isPolygon = function() {
    if (this.nodes && this.nodes.length > 0) {
        // we have node id's - easy
        return this.nodes[0] == this.nodes[this.nodes.length-1];
    } else {
        // compare coordinates
        return (Math.abs(this.coordinates[0][0] - this.coordinates[this.coordinates.length-1][0]) < 1e-6
                && Math.abs(this.coordinates[0][1] - this.coordinates[this.coordinates.length-1][1]) < 1e-6)
    }
}

Way.prototype.addNodeId = function(id) {
    if (!this.nodes) {
        this.nodes = [];
    }
    this.nodes.push(id);
}

Way.prototype.setCoordinates = function(coord) {
    if (this.nodes && coord.length != this.nodes.length) {
        throw new Error("Length of coordinate array does not correspond to nodes array: "+coord.length+" != "+this.nodes.length);
    }
    this.coordinates = coord;
    this.bbox = new BBox(coord);
}

Way.prototype.addTags = function(tags) {
    if (!this.attrs) {
        this.attrs = {};
    }
    for (key in tags) {
        if (tags.hasOwnProperty(key)) {
            this.attrs[key] = tags[key];
        }
    }
}

// store reference to relations which use this way
// rel_memberships is a list of objects with id and role attributes.
Way.prototype.setRel = function(rel_memberships) {
    this.rel = rel_memberships;
}

// calculate the length of the way in meters
Way.prototype.getLengthMeters = function() {
    assert(this.coordinates != undefined);
    assert(this.coordinates.length > 1);

    return geomath.wayLength(this.coordinates);
}

// return a simplified way which omits most points
Way.prototype.getScarceWay = function() {
    assert(this.coordinates != undefined);

    if (this.sketch == undefined) {
        this.sketch = geomath.scarceWay(this.coordinates, 300);
    }

    return this.sketch;
}



