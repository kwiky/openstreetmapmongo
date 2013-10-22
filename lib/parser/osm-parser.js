/*
* Parse Osm (XML) file
*
* Stefan Wehner (2012)
*/


var util = require("util");
var assert = require("assert");

var sax = require("sax");
var Mongojs = require('mongodb');

var BBox = require("../geometry/bbox").BBox;
var Node = require("../geometry/node").Node;
var Way = require("../geometry/way").Way;
var logger = require("../util/logger");
var RelationDB = require("../mongo/relation-mongo");
var WayDB = require("../mongo/way-mongo");
var NodeDB = require("../mongo/node-mongo");
var NodeTmpDB = require("../mongo/tmp-node-mongo");

var Relation = require("../geometry/relation").Relation;

exports.TestInterface = {
    bboxFromXAPIBound: bboxFromXAPIBound,
    injectWayDB: function(mock) {WayDB = mock},
    injectNodeDB: function(mock) {NodeDB = mock},
    injectNodeTmpDB: function(mock) {NodeTmpDB = mock},
    injectRelationDB: function(mock) {RelationDB = mock},
}


exports.OsmParser = OsmParser;

/**
* Parse openstreetmap xml data stream and store nodes, ways and relations in database
* stream      - incoming data stream
* url         - url or filename (to keep track of previously parsed data)
* missing     - called if node or way is referenced in data but wasn't present in the data
*              stream.
* element     - is called with a data bounding box and timestamp and bbox information
*               for all elements processed.
* heartbeat   - (optional) callback function is invoked every second by the parser to
*              deliver status information
* callback    - invoked when parsing has finished
*/
function OsmParser(stream, url, missing, registryCb, heartbeat, callback) {
    logger.trace("OsmParser", arguments);
    // heartbeat is optional, callback is required
    if (!callback) {
        callback = heartbeat;
        heartbeat = undefined;
    }

    var _osm_parser = this;

    this.url = url;
    var strict = true;
    var saxStream = sax.createStream(strict);
    var heartbeatTimerId = undefined;

    // delete existing tmp_node collection
    // NodeTmpDB.drop();

    // status information. count ways and relations
    this.status = {ways: 0
              , relations: 0
              , nodes: 0
              , dbqueue: 0
              , done: false
              }

    // update status callbacks
    function decrDBQueue() { _osm_parser.status.dbqueue--; };
    function missingWay(way) { missing({way: way}); };

    // check periodically if work is done. Call heartbeat and finally call callback
    function checkStatus() {
        // done: the whole input is parsed
        // dbqueue == 0: Nothing is queued for writing
        if (_osm_parser.status.done && _osm_parser.status.dbqueue == 0) {
            clearTimeout(heartbeatTimerId);

            if (heartbeat) heartbeat(_osm_parser.status);
            callback(null);
        } else {
            setTimeout(checkStatus,300);
        }
    }
    setTimeout(checkStatus,300);

    // call heartbeat every second, if defined
    function heartbeatCallback() {
        heartbeat(_osm_parser.status);
        heartbeatTimerId = setTimeout(heartbeatCallback,1000);
    }
    if (heartbeat) {
        heartbeatTimerId = setTimeout(heartbeatCallback,1000);
    }

    // start parsing
    stream.pipe(saxStream);

    // SAX parser events follow

    saxStream.on("error", function (e) {
        logger.warning(e);
        // clear the error
        this._parser.error = null
        this._parser.resume()
    })

    saxStream.on("opentag", function (tag) {
        // switch on tags: node, way, relation and their attributes
        switch(tag.name.toLowerCase()) {
        case 'osm':
            if (tag.attributes.version < parseFloat(0.6)) {
                throw new Error ("Unsupported OSM file version.");
            }
            break;
        case 'bound':
            // XAPI answers with 'bound' tag and swapped lat/lon
            registryCb({bbox: bboxFromXAPIBound(tag.attributes.box)});
            break;
        case 'bounds':
            var bbox = new BBox([[parseFloat(tag.attributes.minlon), parseFloat(tag.attributes.minlat)], [parseFloat(tag.attributes.maxlon), parseFloat(tag.attributes.maxlat)]])
            registryCb({bbox: bbox});
            break;
        case 'node':
            _osm_parser.element = new Node(Mongojs.Long(tag.attributes.id)
                                  ,parseFloat(tag.attributes.lat)
                                  ,parseFloat(tag.attributes.lon)
                                  ,parseInt(tag.attributes.version,10)
                                  ,tag.attributes.visible == 'false' ? false : true
                                  );
            registryCb({timestamp: new Date(tag.attributes.timestamp)});
            break;
        case 'way':
            _osm_parser.element = new Way(Mongojs.Long(tag.attributes.id)
                                  ,parseInt(tag.attributes.version,10)
                                  ,tag.attributes.visible == 'false' ? false : true
                                  );
            registryCb({timestamp: new Date(tag.attributes.timestamp)});
            break;
        case 'relation':
            _osm_parser.element = new Relation(Mongojs.Long(tag.attributes.id)
                                        ,parseInt(tag.attributes.version,10)
                                        ,tag.attributes.visible == 'false' ? false : true
                                        );
            registryCb({timestamp: new Date(tag.attributes.timestamp)});
            break;
        case 'nd':
            // element is a Way object
            _osm_parser.element.addNodeId(Mongojs.Long(tag.attributes.ref));
            break;
        case 'member':
            // element is a Relation object
            if (tag.attributes.type == 'node') {
                var node = new Node(Mongojs.Long(tag.attributes.ref));
                _osm_parser.element.addNodeMember(tag.attributes.role, node);
            } else if (tag.attributes.type == 'way') {
                var way = new Way(Mongojs.Long(tag.attributes.ref));
                _osm_parser.element.addWayMember(tag.attributes.role, way);
            }
            break;
        case 'tag':
            // mongo cannot have a dot in keys
            key = tag.attributes.k.replace('\.',':')
            if (!_osm_parser.element.attrs) {
                _osm_parser.element.attrs = {};
            }
            _osm_parser.element.attrs[key] = tag.attributes.v;
            break;
        }
    });

    saxStream.on("closetag", function (name) {
        switch(name.toLowerCase()) {
        case 'node':
            var node = _osm_parser.element;
            // store node in temporary DB table
            NodeTmpDB.add(node);
            // nodes with properties are also stored in osm table
            if (node.attrs && node.visible) {
                _osm_parser.status.dbqueue++;
                NodeDB.storeNode(node, decrDBQueue);
            }
            _osm_parser.status.nodes++;
            break;
        case 'way':
            _osm_parser.status.ways++;
            if (_osm_parser.element.visible) {
                _osm_parser.status.dbqueue++;
                WayDB.storeWay(_osm_parser.element, decrDBQueue, registryCb);
            }
            break;
        case 'relation':
            _osm_parser.status.relations++;
            if (_osm_parser.element.visible) {
                _osm_parser.status.dbqueue++;
                RelationDB.storeRelation(_osm_parser.element, decrDBQueue, missingWay);
            }
            break;
        }
    });


    saxStream.on("end", function () {
        _osm_parser.status.done = true;
    })

}


function bboxFromXAPIBound(bound) {
    var parseBound = /([\-\.0-9]+),([\-\.0-9]+),([\-\.0-9]+),([\-\.0-9]+)/g;
    var boundMatch = parseBound.exec(bound);
    return new BBox([[parseFloat(boundMatch[2]),parseFloat(boundMatch[1])],[parseFloat(boundMatch[4]),parseFloat(boundMatch[3])]]);
}



