/**
* Interface for reading OSM data from Mongo
*
* Stefan Wehner 2012
*/

var OsmComplete = require('./').OsmComplete;
var Settings = require('./').Settings;


exports.OsmMongo = OsmMongo;

function OsmMongo(mongo_host, mongo_port) {
    mongo_host = mongo_host || Settings.MONGO_HOST;
    mongo_port = mongo_port || Settings.MONGO_PORT;
    this.osm = OsmComplete(mongo_host, mongo_port);
}

/*
* Callback function signature for all calls below: function(error, result)
* 'error' is either null or contains an error string
* 'result' is an object with attributes:
*
* result = {
*    nodes: []       // array of geometry/node objects
*    ways: []        // array of geometry/way objects
*    relations: []   // array of geometry/relation objects
* }
*
*/

/*
* Search database for nodes, ways and relations with the given tag(s).
* 'tags' is a query object for OSM tags.
*
* Examples: tags = {highway: "motorway"}
*           tags = {natural: {$in: ["wood", "scrub"]}}
*
* WARNING: Slow, as it has to search the whole database.
*/
OsmMongo.prototype.findOsm = function(tags, callback) {
    this.osm.findOsm(tags, callback);
}

/*
* Search database for nodes, ways and relations with the given tag(s)
* near a given location(s).
*
* 'loc' is a point [lon,lat] or an array of points [[lon,lat],...]
* 'distance' is in kilometers.
*/
OsmMongo.prototype.findOsmNear = function(loc, distance, tags, group, callback) {
    this.osm.findOsmNear(loc, distance, tags, group, callback);
}

/*
* Search database for nodes, ways and relations with the given tag(s)
* inside a given bounding box.
*
* 'bbox' is a bounding box object (import geometry/bbox)
* Example: var bbox = new BBox([[34.89,71.66],[35.11,72.02]]);
*
* WARNING: This will be slow for a large bounding box!
*/
OsmMongo.prototype.findOsmBox = function(bbox, tags, callback) {
    this.osm.findOsmBox(bbox, tags, callback);
}

/*
* Search database for nodes, ways and relations with the given tag(s)
* inside a given polygon.
*
* 'polygon' is an array of coordinates [[lon,lat],...]
*
* WARNING: This will be slow for a large polygon!
*/
OsmMongo.prototype.findOsmPolygon = function(polygon, tags, callback) {
    this.osm.findOsmPolygon(polygon, tags, callback);
}

