/*
* Write logs with timestamp to mongo or console
*
* Stefan Wehner (2012)
*/

var util = require('util');
var Settings = require('../util/settings').getSettings;
var MongoOsm = require('../mongo/mongo-connect');

var last_timestamp = undefined;
var beyond_timstamp = 0;
var collection = undefined;

exports.TestInterface = {
    injectMongoOsm: function(mongo) {MongoOsm = mongo},
    overrideLogToStderr: function(toStderr) {logToStderr = toStderr},
    toMessageObject: toMessageObject,
    getId: getId
}


function getId(level) {
    var t = new Date();

    if (t == last_timestamp) {
        // gives some extra precision if time has not changed
        beyond_timestamp++;
    } else {
        last_timestamp = t;
        beyond_timestamp = 0;
    }
    return {'t': t, 'b': beyond_timestamp, 'level': level};
}

function toMessageObject(level, msg, obj) {
    // timestamp is id
    var out = {'_id': getId(level)};
    out.message = msg;
    if (obj) {
        for (o in obj) {
            if (obj.hasOwnProperty(o)) {
                if (typeof obj[o] == 'object' && obj[o] != null) {
                    out[o] = obj[o].toString();
                } else {
                    out[o] = obj[o]
                }
            }
        }
    }
    return out;
}

var Level = ['TRACE', 'DEBUG', 'INFO', 'WARNING', 'ERROR'];

logToStderr = function(level, msg, obj) {
    if (obj) {
        console.warn("%s %s %s %s", new Date(), Level[level], msg, util.inspect(obj, false, 2, true));
    } else {
        console.warn("%s %s %s", new Date(), Level[level], msg);
    }
}

var LogBuffer = [];

// log to mongo collection (if defined)
// log to stderr (if level > configured level)
function write(level, msg, obj) {
    if (Settings().LOGGER_COLLECTION) {
        // buffer logs in case that DB is not yet open
        LogBuffer.push(toMessageObject(level, msg, obj));
        try {
            var collection = MongoOsm.getCollection(Settings().LOGGER_COLLECTION);
            collection.insert(LogBuffer, {safe: false});
            LogBuffer = [];
        } catch (e) {}
    }
    var user_level = Settings().LOGGER_CONSOLE_LEVEL == undefined ? 3 : Settings().LOGGER_CONSOLE_LEVEL;
    if (level >= user_level) {
        logToStderr(level, msg, obj);
    }
}

// log levels take a string or an object
exports.trace = function(msg, obj) {
    write(0, msg, obj);
}

exports.debug = function(msg, obj) {
    write(1, msg, obj);
}

exports.info = function(msg, obj) {
    write(2, msg, obj);
}

exports.warning = function(msg, obj) {
    write(3, msg, obj);
}

exports.error = function(msg, obj) {
    write(4, msg, obj);
}

