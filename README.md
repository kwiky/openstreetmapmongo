# OpenstreetmapMongo

## Credits
* Stefan Wehner <stefan@navimont.com>
* Steve Grosbois <steve.grosbois@gmail.com>

## Description
Store Openstreetmap data in Mongo DB

## Usage
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
	});

## Links

### Node and npm modules
* http://nodejs.org/api/
* https://github.com/isaacs/sax-js
* http://mongodb.github.com/node-mongodb-native/

### Openstreetmap
* http://wiki.openstreetmap.org/wiki/Xapi
* http://wiki.openstreetmap.org/wiki/API_v0.6
