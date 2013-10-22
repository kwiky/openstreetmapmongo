/**
* Test functions for osm complete api
*
* Stefan Wehner 2012
*/

var util = require("util");

var OsmComplete = require('../lib/access/osm-complete').OsmComplete;
var TestInterface = require('../lib/access/osm-complete').TestInterface;

var Collection = {
    toArray: function(callback) {
        callback(null);
    },
    find: function(query) {
        return this;
    }
}

var MongoMock = {
    connect: function(host, port, callback) {
        setTimeout(callback, 100);
    },
    getCollection: function(name) {
        return Collection;
    }
}

exports.osmAccess = {
    setUp: function(callback) {
        TestInterface.injectMongoDb(MongoMock);
        TestInterface.injectLogger({debug: function(){}});
        this.osm = OsmComplete('osm.osmogon.org', 27017);
        callback();
    },
    sameInstanceForSameDb: function(test) {
        var anotherConnection = OsmComplete('osm.osmogon.org', 27017);
        test.equals(true, this.osm === anotherConnection);
        test.done();
    },
    newInstanceForNewDb: function(test) {
        var anotherConnection = OsmComplete('osm.osmogon.org', 99999);
        test.equals(false, this.osm === anotherConnection);
        test.done();
    },
    lateExecuteRequest: function(test) {
        function result(error, result) {
            // verify queue is empty
            test.equal(0, thirdConnection.queued.length);
            test.done();
        }
        var osmConverter = {
            convertToOsm: function(collection, result, callback) {
                test.deepEqual(Collection, collection);
                callback(null, "");
            }
        }
        TestInterface.injectOsmConverter(osmConverter);

        var thirdConnection = OsmComplete('osm2', 333);
        thirdConnection.findOsm({highway: 'footpath'}, result);
        // verify find is enqueued
        test.equal('function', typeof thirdConnection.queued[0]);
    },
    readFromDB: function(test) {
        test.done();
    }
}

exports.tagsPrefix = function(test) {
    var query = {a: 1, b: {$in: ['3', '4']}};
    test.deepEqual({'tags.a': 1, 'tags.b': {$in: ['3', '4']}}, TestInterface.tagsPrefix(query));
    test.done();
}
