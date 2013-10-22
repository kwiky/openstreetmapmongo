/*
* Main
*
* Stefan Wehner (2012)
*/

// Classes for OSM primitives
exports.Way = require('./geometry/way').Way;
exports.Node = require('./geometry/node').Node;
exports.Relation = require('./geometry/relation').Relation;

// Parser
exports.OsmParser = require('./parser/osm-parser').OsmParser;

// Database views
exports.OsmComplete = require('./access/osm-complete').OsmComplete;

// logger
exports.Logger = require('./util/logger');

// settings
exports.Settings = require('./util/settings').getSettings();

// store OSM primitives to MongoDB
exports.MongoOsm = require('./mongo/mongo-connect');
exports.WayDb = require('./mongo/way-mongo');
exports.RelationDb = require('./mongo/relation-mongo');
exports.TmpNodeDb = require('./mongo/tmp-node-mongo');
exports.TileDB = require('./mongo/tiles-mongo');

// convert from MongoDb representation to OSM primitive
exports.RelationConverter = require('./access/relation-converter').RelationConverter;

// GIS geometry
exports.BBox = require('./geometry/bbox').BBox;
exports.Geomath = require('./geometry/geomath');
exports.Transform = require('./geometry/geomath').Transform;
exports.PolygonUtils = require('./geometry/polygon-utils');

// registry for downloaded data
exports.TileRegistry = require('./parser/tile-registry').TileRegistry;

