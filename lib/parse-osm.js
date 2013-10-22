/**
* Main module for openstreetmap-mongo, the parsnip osm file parser.
* Reads an osm file (in XML format) and writes the contents to mongo DB
*
* Start with:
* $ node parse-osm.js <osmfile>
*
* Stefan Wehner (2012)
*/

var fs = require("fs");
var util = require("util");
var assert = require('assert');

var Settings = require('./').Settings;
var Parser = require("./").OsmParser;
var MongoOsm = require('./').MongoOsm;
var Logger = require("./").Logger;
var TileRegistry = require("./").TileRegistry;
var TileDB = require("./").TileDB;

// read osm file name from command line and open stream
var filename = process.argv.pop();


fs.stat(filename, function(err,stats) {
    if (err) {
        console.log("Can't open file: "+filename);
        process.exit(-1);
    }
    // connect to DB
    MongoOsm.connect(Settings.MONGO_HOST, Settings.MONGO_PORT, function() {
        Logger.info('Start parsing', {'file': filename});

        // look in tiles collection if this was loaded before
        MongoOsm.getCollection(Settings.TILES_COLLECTION).findOne({'_id.uri': filename}, {sort: {read_timestamp: -1}}, function(error, result) {
            assert.equal(null,error);
            if (result) {
                console.log(result['_id']['uri']+" has been inserted before on "+result['_id']['read_timestamp']);
            }
        });

        var Tile_registry = new TileRegistry(filename);
        // callback for tile registry
        function elementCallback(data) {
            if (data.hasOwnProperty('timestamp')) {
                Tile_registry.updateTimestamp(data.timestamp);
            }
            if (data.hasOwnProperty('elementBBox')) {
                Tile_registry.updateElementBBox(data.elementBBox);
            }
            if (data.hasOwnProperty('bbox')) {
                Tile_registry.setBBox(data.bbox);
            }
        }

        // start parsing file
        var stream = fs.createReadStream(filename);
        var osm_parser = new Parser(stream, filename, missingCallback, elementCallback, parserHeartbeat, function() {
            // register downloaded tiles in mongo
            var tiles_data = Tile_registry.getMongoEntry();
            TileDB.storeTiles(tiles_data);

            console.log("Done.")
            process.exit(0);
        });
        console.log("Start parsing "+filename+"...")
    });
})

function missingCallback(missing) {
    // don't care
}

function parserHeartbeat(stat) {
    Logger.info('parser statistics', stat);
    console.log(util.format("Found %d nodes, %d ways and %d relations (%d queued for DB write).", stat.nodes, stat.ways, stat.relations, stat.dbqueue));
}

