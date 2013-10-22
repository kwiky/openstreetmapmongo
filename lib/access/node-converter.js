/**
* Convert OSM data from Mongo DB to proper node.
*
* Stefan Wehner (2012)
*/

var Node = require('../geometry/node').Node;


exports.NodeConverter = NodeConverter;

// relation_id parameter is only used if feature is part of a relation
function NodeConverter(collection, osm, callback) {
    this.collection = collection;
    this.osm = osm;
    this.node = new Node(osm._id.osm, osm.loc[1], osm.loc[0]);
    this.node.setTags(osm.tags);
    // applies for nodes which are part of a relation
    this.node.setRel(osm.rel);
    var context = this;

    process.nextTick(function() {callback(null, context.node)});
}

