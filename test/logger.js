/*
* Tests for logger
*
* Stefan Wehner (2012)
*/

var logger = require('../lib/util/logger');
var Settings = require('../lib/util/settings');

exports.createId = function(test) {
    var timestamp = new Date();

    var id = logger.getId(1);

    test.equals(0, id.b);
    test.equals(1, id.level);
    test.ok((id.b - timestamp) < 10);

    test.done();
}

exports.StringToMessageObject = function(test) {
    var msg = logger.toMessageObject(1,"hello");

    test.equals(1,msg['_id']['level']);
    test.equals("hello", msg.message);

    test.done();
}

exports.ObjectToMessageObject = function(test) {
    var myObj = {'foo': 'bar', "hello": 'world'};

    var msg = logger.toMessageObject(2, "", myObj);

    test.equals(2,msg['_id']['level']);
    test.equals("", msg.message);
    test.equals("bar", msg.foo);
    test.equals("world", msg.hello);

    test.done();
}




module.exports = {
    setUp: function (callback) {
        var context = this;
        var collection = {
            insert: function(obj) {
                context.inserted = obj[0];
            }
        };
        var dbmock = {getCollection: function() {return collection}};
        logger.TestInterface.injectMongoOsm(dbmock);
        Settings.setSettings({LOGGER_COLLECTION: 'mock'});
        logger.TestInterface.overrideLogToStderr(function(level,msg,obj) {context.stdout_msg = msg});
        callback();
    },
    testErrorLog: function(test) {
        logobj = {'foo': 'bar'};

        logger.error("nix",logobj);

        test.equals(4, this.inserted._id.level);
        test.equals('bar', this.inserted.foo);
        test.equals('nix', this.stdout_msg);

        test.done();
    },
    testWarningLog: function(test) {
        logger.warning('hello');

        test.equals(3, this.inserted._id.level);
        test.equals('hello', this.inserted.message);
        test.equals('hello', this.stdout_msg);
        test.done();
    },
    testInfoLog: function(test) {
        logger.info("test");
        test.equals(2,this.inserted._id.level);
        test.equals(undefined,this.stdout_msg);
        test.done();
    },
    testDebugLog: function(test) {
        logger.debug("test");
        test.equals(1, this.inserted._id.level);
        test.done();
    },
    testTraceLog: function(test) {
        logger.trace("test");
        test.equals(0,this.inserted._id.level);
        test.done();
    }
}



