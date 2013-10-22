/**
* Test functions for temporary node storage
*
* Stefan Wehner 2012
*/

var Node = require('../lib').Node;
var TmpNodeDb = require('../lib').TmpNodeDb;

var Nodes = {};

// mocks
var Collection = {
    insert: function(data) {
        Nodes[data._id] = data.loc;
    },
    find: function(query, cb) {
        var cursor = {nodes: [],
                      toArray: function(cb) {
                          cb(null,this.nodes);
                      }};
        var error = false;
        query._id['$in'].forEach(function(id) {
            if (Nodes[id]) {
                cursor.nodes.push({_id: id, loc: Nodes[id]});
            }
        })
        cb(error, cursor);
    }
};

var Mongo = {
    getCollection: function() {return Collection;}
}


exports.tmpNodes = {
    setUp: function(callback) {
        TmpNodeDb.TestInterface.injectDB(Mongo);
        // store 100 nodes
        for (var i=0; i<100; i++) {
            var nd = new Node(i*10, i, i, 1, true);
            TmpNodeDb.add(nd);
        }
        callback();
    },
    readExistingNodes: function(test) {
        TmpNodeDb.getNodes([100], function(error, nodes) {
            test.ok(!error);
            test.deepEqual({100: [10,10]}, nodes);
            test.done();
        })
    },
    readExistingLocations: function(test) {
        TmpNodeDb.getLocations([100,110,120,990,980], function(error, nodes) {
            test.ok(!error);
            test.deepEqual([[10,10],[11,11],[12,12],[99,99],[98,98]], nodes);
            test.done();
        })
    },
    readExistingAndNonExistingLocations: function(test) {
        TmpNodeDb.getLocations([330,12], function(error, nodes) {
            test.ok(error);
            test.done();
        });
    }
}
