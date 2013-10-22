/**
* Convert OSM data from Mongo DB to proper way.
*
* Stefan Wehner (2012)
*/

var Way = require('../geometry/way').Way;

exports.WayConverter = WayConverter;

WayConverter.prototype.waySegmentsLookup = function(callback) {
    var query = {"_id.osm": this.way.osm_id,
                 "_id.seg": {"$gt": 0}
                };
    this.coordinates = [];

    // for use by inner function
    var context = this;

    this.collection.find(query, {sort: '_id.seg'}).toArray(function(error, result) {
        if( !error ) {
            for (var rx=0; rx<result.length; rx++) {
                var nodes;
                if (result[rx]._id.seg > 1) {
                    // drop the common node
                    nodes = result[rx].nd.slice(1);
                } else {
                    nodes = result[rx].nd;
                }

                context.coordinates = context.coordinates.concat(nodes);
            }
            context.way.setCoordinates(context.coordinates);
        }
        process.nextTick(function() {callback(error,context.way)});
    });
}


function WayConverter(collection, osm, callback) {
    this.collection = collection;
    this.osm = osm;
    this.way = new Way(osm._id.osm, osm.v);
    this.way.addTags(osm.tags);
    // applies to ways which are part of a relation
    this.way.setRel(osm.rel);

    this.waySegmentsLookup(callback);
}

