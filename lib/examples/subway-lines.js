/**
* openstreetmap-mongo usage example: Measure the total length of all railways in a given area.
*
* Stefan Wehner 2012
*/

var assert = require('assert');
var util = require('util');

var OsmMongo = require('../osm-mongo').OsmMongo;

settings = {
    MONGO_HOST: 'localhost',
    MONGO_PORT: 27017
}

osm = new OsmMongo(settings.MONGO_HOST, settings.MONGO_PORT);

// find a subway lines near Santiago center
osm.findOsmNear([ -70.650404, -33.4379537 ], 16, {railway: "subway"}, function(error, subway) {
    var len = 0;
    subway.ways.forEach(function(way) {
        len += way.getLengthMeters();
    })
    console.log("Total subway length in km "+len/1000.0);
    process.exit(0);
})




