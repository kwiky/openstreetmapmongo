/* Node object
*
* Stefan Wehner (2012)
*/

exports.Node = Node;

function Node(osm_id,lat,lon,version,visible) {
    this.visible = visible;
    this.lat = lat;
    this.lon = lon;
    this.osm_id = osm_id;
    this.version = version;
    this.attrs = undefined;
    this.rel = undefined;
}

// store reference to relations which use this node
// rel_memberships is a list of objects with id and role attributes.
Node.prototype.setRel = function(rel_memberships) {
    this.rel = rel_memberships;
}

Node.prototype.setTags = function(tags) {
    this.attrs = tags;
}

Node.prototype.getLoc = function() {
    return [this.lon,this.lat];
}
