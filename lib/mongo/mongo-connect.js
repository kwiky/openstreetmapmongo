/**
* Handle mongo db operations
*
* Stefan Wehner 2012
*/

var Mongojs = require('mongodb');
var assert = require('assert');

var Settings = require('../util/settings').getSettings();

// DB connection
var DB = undefined;

// keep a pool of collections
var availableCollections = {};

// Connect to database and the predefind collections (in collections Array)
exports.connect = function(host, port, callback) {
    var outstanding_collections = 0;

    function waitForCollections() {
        if (outstanding_collections == 0) {
            callback();
        } else {
            setTimeout(waitForCollections,30);
        }
    }

    db = new Mongojs.Db('osm', new Mongojs.Server(host, port, {auto_reconnect: true}, {}));
    db.open(function(error, db) {
        if (error) {
            throw new Error("Can't connect to MongoDB. Is mongod running?\n"+error);
        }
        DB = db;
        console.log("Opened MongoDb on "+host+":"+port);
        if (Settings.LOGGER_COLLECTION) {
            outstanding_collections++;
            db.collectionNames(Settings.LOGGER_COLLECTION, function(err, items) {
                assert.equal(null, err);
                if (items.length == 0) {
                    // create capped collection
                    db.createCollection(Settings.LOGGER_COLLECTION, {capped: true, size: Settings.LOGGER_COLLECTION_SIZE, safe:true}, function(err, collection) {
                        assert.equal(null, err);
                        availableCollections[Settings.LOGGER_COLLECTION] = collection;
                        outstanding_collections--;
                    })
                } else {
                    db.collection(Settings.LOGGER_COLLECTION, function(error, collection) {
                        assert.equal(null,error);
                        availableCollections[Settings.LOGGER_COLLECTION] = collection;
                        outstanding_collections--;
                    })
                }
            })
        }
        if (Settings.OSM_COLLECTION) {
            outstanding_collections++;
            db.collection(Settings.OSM_COLLECTION, function(error, collection) {
                assert.equal(null,error);
                availableCollections[Settings.OSM_COLLECTION] = collection;
                collection.ensureIndex({'loc': "2d"});
                collection.ensureIndex({'_id.osm': 1});
                collection.ensureIndex({'rel.id': 1});
                // indexes for the most common osm keys
                collection.ensureIndex({'tags.name': 1});
                collection.ensureIndex({'tags.highway': 1});
                collection.ensureIndex({'tags.ref': 1});
                collection.ensureIndex({'tags.waterway': 1});
                collection.ensureIndex({'tags.railway': 1});
                collection.ensureIndex({'tags.amenity': 1});
                collection.ensureIndex({'tags.leisure': 1});
                collection.ensureIndex({'tags.tourism': 1});
                collection.ensureIndex({'tags.service': 1});
                collection.ensureIndex({'tags.natural': 1});
                collection.ensureIndex({'tags.landuse': 1});
                outstanding_collections--;
            })
        }
        if (Settings.TILES_COLLECTION) {
            outstanding_collections++;
            db.collection(Settings.TILES_COLLECTION, function(error, collection) {
                assert.equal(null,error);
                availableCollections[Settings.TILES_COLLECTION] = collection;
                collection.ensureIndex({'_id.loc': "2d", 'data_timestamp': -1});
                outstanding_collections--;
            })
        }
        // temporary collection for nodes
        outstanding_collections++;
        var node_tmp_collection = Settings.NODE_TMP_COLLECTION || 'tmp_nodes';
        db.collection(node_tmp_collection, function(error, collection) {
            assert.equal(null,error);
            availableCollections[node_tmp_collection] = collection;
            outstanding_collections--;
        })
        process.nextTick(waitForCollections);
    });
}

exports.getCollection = function(coll) {
    if (!DB) {
        throw new Error("No database connection.");
    }
    if (!availableCollections[coll]) {
        throw new Error("Unknown collection "+coll+" Use: "+function(){var res=""; for (coll in availableCollections) res+=coll+", "; return res}());
    }
    return availableCollections[coll];
}

