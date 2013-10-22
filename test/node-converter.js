/*
* Test cases for node converter
*
* Stefan Wehner (2012)
*/

var NodeConverter = require('../lib/access/node-converter').NodeConverter;

exports.oneNode = function(test) {
    function callback(error, node) {
        test.equal(123, node.osm_id);
        test.equal(34, node.lon);
        test.equal(71, node.lat);
        test.done();
    }
    var mongoNode = {_id: {osm: 123}, loc: [34,71]};
    var ncon = new NodeConverter(null, mongoNode, callback);
}
