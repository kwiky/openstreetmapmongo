/*
* Load settings file for application.
*
* Stefan Wehner (2012)
*/


var Settings = {
  "MONGO_HOST": "localhost"
, "MONGO_PORT": 27017
, "MONGO_DB": "osm"
, "MONGO_DB_help": "mongo database name"
, "LOGGER_COLLECTION_help": "log to this mongo collection instead of stdout"
, "LOGGER_COLLECTION": "beet_log"
, "LOGGER_COLLECTION_SIZE": 1000000
, "LOGGER_CONSOLE_LEVEL": 3
, "FOLLOW_MISSING_WAYS_help": "load ways outside the tile if referenced by relations"
, "FOLLOW_MISSING_WAYS": false
, "OSM_API_URL_help": "a list of openstreetmap XAPI servers (must include name, port, and path with last slash up to the parameter string)"
, "OSM_API_URL": ["http://open.mapquestapi.com/xapi/api/0.6/"]
, "OSM_COLLECTION_help": "store all osm data in this collection"
, "OSM_COLLECTION": "osm"
, "TILES_COLLECTION_help": "store here all downloaded tiles"
, "TILES_COLLECTION": "tiles"
}

exports.setSettings = function(settings) {
    Settings = settings;
}

exports.getSettings = function() {
    return Settings;
}
