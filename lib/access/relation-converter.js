/**
* Convert OSM data from Mongo DB to proper relation.
*
* Stefan Wehner (2012)
*/

var Node = require('../geometry/node').Node;
var Way = require('../geometry/way').Way;
var Relation = require('../geometry/relation').Relation;

var NodeConverter = require('../access/node-converter').NodeConverter;
var WayConverter = require('../access/way-converter').WayConverter;

var reduceMembers = require('../geometry/polygon-utils').reduceMembers;


/*
* All way members of the relation which have the same role will be combined
* into longer ways or polygons.
*
*/
RelationConverter.prototype.combineWays = function() {
    var context = this;

    // go over existing roles
    for (role in context.relation.ways) {
        if (context.relation.ways.hasOwnProperty(role)) {
            // combine all way coordinates in one list of list of coordinates
            var segments = [];
            context.relation.ways[role].forEach(function(way) {
                segments.push(way.coordinates);
            })
            // Reduce and save the new way object
            context.relation.ways[role] = [];
            reduceMembers(segments).forEach(function(coords) {
                var way = new Way();
                way.setCoordinates(coords);
                context.relation.ways[role].push(way);
            });
        }
    }
}

// wait for the node and way converters to call back
RelationConverter.prototype.featureCb = function(error, feature) {
    this.outstanding_members--;
    var context = this;
    var role = undefined;
    var errors = [];

    if (error) {
        errors.push(error);
    } else {
        if (feature) {
            if (!feature.rel) {
                throw new Error("Relation "+context.relation.osm_id+" member "+feature.osm_id+" missing 'rel' field.");
            }
            // determine the role in the relation
            feature.rel.forEach(function(rp) {
                if (rp.id == context.relation.osm_id) {
                    role = rp.r;
                }
            })
            if (role === undefined) {
                throw new Error("Relation "+context.relation.osm_id+" member "+feature.osm_id+" missing role.");
            }

            // add node and way members to relation. We only care about the member's id
            // its coordinates and its role. The member's tags are not preserved as they
            // should not matter for the relation.
            if (feature instanceof Node) {
                this.relation.addNodeMember(role, feature);
            } else if (feature instanceof Way) {
                this.relation.addWayMember(role, feature);
            } else {
                throw new Error("Relation "+context.relation.osm_id+" Unknown member type: "+feature);
            }
        }
    }

    if (context.outstanding_members <= 0) {
        // combine all way members with the same role into a single path.
        context.combineWays();

        var error = errors.length ? errors : null;
        process.nextTick(function() {context.callback(error, context.relation)});
    }
};

exports.RelationConverter = RelationConverter;

function RelationConverter(collection, osm, callback) {
    this.collection = collection;
    this.osm = osm;
    this.callback = callback;
    this.relation = new Relation(osm._id.osm, osm.v);
    this.relation.addTags(osm.tags);
    this.outstanding_members = 0;

    // for use by inner function
    var context = this;

    // query for relation members
    var query = {"rel.id": this.osm._id.osm};
    this.collection.find(query).toArray(function(error, result) {
        if( !error && result.length > 0) {
            for (var ix=0; ix<result.length; ix++) {
                var osm = result[ix];
                switch(osm.type) {
                case 'n':
                  context.outstanding_members++;
                  new NodeConverter(context.collection, osm, function(error, node) {context.featureCb(error, node);});
                  break;
                case 'w':
                case 'p':
                  context.outstanding_members++;
                  new WayConverter(context.collection, osm, function(error, way) {context.featureCb(error, way);});
                  break;
                default:
                  throw new Error("Unknown type "+osm.type+" for osm data id: "+osm._id.osm);
                }
            }
        } else {
            process.nextTick(function() {callback(error,context.relation) });
        }
    });


}

