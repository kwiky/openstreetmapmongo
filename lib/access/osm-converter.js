/**
* Convert mongo query results to proper OSM nodes, ways and relations
*
* Stefan Wehner 2012
*/

var Node = require('../geometry/node').Node;
var Way = require('../geometry/way').Way;
var Relation = require('../geometry/relation').Relation;

var NodeConverter = require('../access/node-converter').NodeConverter;
var WayConverter = require('../access/way-converter').WayConverter;
var RelationConverter = require('../access/relation-converter').RelationConverter;

exports.convertToOsm = function(collection, result, callback) {
    var dedup = {};
    var res = { nodes: []
              , ways: []
              , relations: []
              };

    var oustanding_requests = 0;
    var errors = [];

    // wait for the individual converters to call back
    function featureCb(error, feature) {
        oustanding_requests--;
        if (error) {
            errors.push(error);
        } else {
            if (feature instanceof Node) {
                res.nodes.push(feature);
            }
            if (feature instanceof Way) {
                res.ways.push(feature);
            }
            if (feature instanceof Relation) {
                res.relations.push(feature);
            }
        }
        if (oustanding_requests <= 0) {
            var error = null;
            if (errors.length) {
                error = errors.join('\n');
            }
            callback(error, res);
        }
    };

    for (var ix=0; ix<result.length; ix++) {
        var osm = result[ix];
        // do not process duplicate finds from $within queries
        if (!dedup[osm._id.osm]) {
            dedup[osm._id.osm] = true;
            switch(osm.type) {
            case 'n':
              oustanding_requests++;
              new NodeConverter(collection, osm, featureCb);
              break;
            case 'w':
            case 'p':
              oustanding_requests++;
              new WayConverter(collection, osm, featureCb);
              break;
            case 'r':
              oustanding_requests++;
              new RelationConverter(collection, osm, featureCb);
              break;
            default:
                throw new Error("Unknown type "+osm.type+" for osm data id: "+osm._id.osm);
            }
        }
    }

    // this will produce a callback even if no data was found
    oustanding_requests++;
    process.nextTick(featureCb);
}
