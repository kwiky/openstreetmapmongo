/**
* Test functions for osm-parser
* Stefan Wehner 2012
*/
var util = require("util");
var events = require("events");

var BBox = require('../lib').BBox;
var OsmParser = require('../lib').OsmParser;
var TestInterface = require('../lib/parser/osm-parser').TestInterface;


function MyStream() {
    events.EventEmitter.call(this);
    this.destination;
}

util.inherits(MyStream, events.EventEmitter);

MyStream.prototype.write = function(data) {
    this.destination.write(data);
    this.destination.end();
}

MyStream.prototype.pipe = function(destination) {
    this.destination = destination;
    return this.destination;
}


exports.bboxFromXAPIBound = function(test) {
    var bound = "-1.1,-2.2,3.3,4.4"

    test.deepEqual([[-2.2,-1.1],[4.4,3.3]], TestInterface.bboxFromXAPIBound(bound).bbox());
    test.done();
}

// create Mocks
var tmp_nodes;
var nodes;
var ways;
var relations;

var NodeTmpDb = {
    drop: function() {},
    add: function(nodes) {tmp_nodes++}
}

var WayDb = {
    storeWay: function(way, decrDBQueue) {
        ways++;
        decrDBQueue();
    }
}

var NodeDb = {
    storeNode: function(node, decrDBQueue) {
        nodes++;
        decrDBQueue();
    }
}

var RelationDb = {
    storeRelation: function(relation, decrDBQueue) {
        relations++;
        decrDBQueue();
    }
}


exports.mockedDB = {
    setUp: function(callback) {
        TestInterface.injectWayDB(WayDb);
        TestInterface.injectNodeDB(NodeDb);
        TestInterface.injectRelationDB(RelationDb);
        TestInterface.injectNodeTmpDB(NodeTmpDb);
        this.heartbeat = function(state) {};
        this.missing = function() {};
        this.registry = function() {};
        callback();
    },
    parseTriangles: function(test) {
        tmp_nodes = 0;
        nodes = 0;
        ways = 0;
        relations = 0;
        var callback = function() {
            test.equals(18,tmp_nodes);
            test.equals(1,nodes);
            test.equals(5,ways);
            test.equals(1,relations);
            test.done();
        }
        var stream = new MyStream();
        var parser = new OsmParser(stream, "data", this.missing, this.registry, this.heartbeat, callback);
        stream.write(triangles);
    }
}


var triangles = "<?xml version='1.0' encoding='UTF-8'?> \
<osm version='0.6' generator='JOSM'> \
  <bound box='-71.70000,-36.70000,-71.60000,-36.60000' origin='Osmosis SNAPSHOT-r26564'/> \
  <node id='-141' visible='true' version='1' lat='6.664919849634562E-4' lon='0.02708083491619075' /> \
  <node id='-136' visible='true' version='1' lat='0.03489815687320812' lon='0.026181691691717197' /> \
  <node id='-123' visible='true' version='1' lat='0.019987514666256596' lon='-0.027263868873027477' /> \
  <node id='-121' visible='true' version='1' lat='0.0048958182924873205' lon='-0.038941967566581255' /> \
  <node id='-119' visible='true' version='1' lat='-0.012082340481865758' lon='-0.02331128162290158' /> \
  <node id='-117' visible='true' version='1' lat='-0.010555204528706737' lon='0.004626323713215536' /> \
  <node id='-115' visible='true' version='1' lat='0.0013025571618547449' lon='0.015855264764709553' /> \
  <node id='-113' visible='true' version='1' lat='0.02915032971209702' lon='-6.73736463089641E-4' /> \
  <node id='-111' visible='true' version='1' lat='0.025646900505143844' lon='-0.028880836384442613' /> \
  <node id='-109' visible='true' version='1' lat='0.019358694004443934' lon='0.03445039114598365' /> \
  <node id='-107' visible='true' version='1' lat='0.007051774962528649' lon='0.023580776208137443' /> \
  <node id='-105' visible='true' version='1' lat='0.0031890192569713903' lon='0.0428047232882952' /> \
  <node id='-103' visible='true' version='1' lat='0.015226443886594382' lon='0.05861507228879878' /> \
  <node id='-101' visible='true' version='1' lat='0.010824699109239043' lon='-0.0178315583897725' /> \
  <node id='-99' visible='true' version='1' lat='0.0010330625766751152' lon='-0.017382400747712738' /> \
  <node id='-97' visible='true' version='1' lat='0.0015720517470055571' lon='0.003009356201800397' /> \
  <node id='-97' visible='true' version='1' lat='0.015720' lon='0.0040'> \
      <tag k='name' v='swetest' /> \
  </node> \
  <node id='-95' action='modify' visible='true' version='1' lat='0.016843411334624886' lon='-0.007590764150809959' /> \
  <way id='-133' action='modify' visible='true' version='1'> \
    <nd ref='-113' /> \
    <nd ref='-111' /> \
    <nd ref='-123' /> \
    <nd ref='-121' /> \
    <nd ref='-119' /> \
  </way> \
  <way id='-131' action='modify' visible='true' version='2'> \
    <nd ref='-109' /> \
    <nd ref='-107' /> \
    <nd ref='-105' /> \
    <nd ref='-103' /> \
    <nd ref='-109' /> \
  </way> \
  <way id='-129' action='modify' visible='true' version='1'> \
    <nd ref='-95' /> \
    <nd ref='-101' /> \
    <nd ref='-99' /> \
  </way> \
  <way id='-127' visible='true' version='1'> \
    <nd ref='-99' /> \
    <nd ref='-97' /> \
    <nd ref='-95' /> \
  </way> \
  <way id='-125' visible='true' version='1'> \
    <nd ref='-119' /> \
    <nd ref='-117' /> \
    <nd ref='-115' /> \
    <nd ref='-113' /> \
  </way> \
  <relation version='1' id='-135' action='modify' visible='true'> \
    <member type='node' ref='-141' role='' /> \
    <member type='node' ref='-136' role='nody' /> \
    <member type='way' ref='-133' role='outer' /> \
    <member type='way' ref='-125' role='outer' /> \
    <member type='way' ref='-129' role='inner' /> \
    <member type='way' ref='-127' role='inner' /> \
    <member type='way' ref='-131' role='' /> \
    <member type='way' ref='-200' role='' /> \
    <tag k='name' v='swetest' /> \
    <tag k='type' v='multipolygon' /> \
  </relation> \
</osm> "

