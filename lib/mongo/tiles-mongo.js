/*
* Tile grid access functions
*
* Stefan Wehner (2012)
*/

var logger = require("../util/logger");

var DB = require("../mongo/mongo-connect");
var Settings = require('../util/settings').getSettings();

var TILES_COLLECTION = Settings.TILES_COLLECTION || 'tiles';


exports.storeTiles = function(tilesdata) {
    logger.trace("Register tiles.", tilesdata);
    DB.getCollection(TILES_COLLECTION).insert(tilesdata, function(error) {
        if (error) {
            throw new Error("Could not insert tile information: "+error);
        }
    });
}
