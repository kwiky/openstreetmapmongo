/*
* Test cases for way converter
*
* Stefan Wehner (2012)
*/

var WayConverter = require('../lib/access/way-converter').WayConverter;

exports.way = function(test) {
    var collection = {
        find: function(query, sort) {
            test.equal(123, query["_id.osm"]);
            test.equal('_id.seg', sort.sort);
            return this;
        },
        toArray: function(callback) {
            var res = [{_id: {seg: 1}, nd: [[1,1],[2,2]]},{_id: {seg: 2}, nd: [[2,2],[3,3]]}];
            callback(null, res);
        }
    }
    function callback(error, way) {
        test.equal(123, way.osm_id);
        test.equal(3, way.version);
        test.deepEqual({highway: "racetrack"}, way.attrs);
        test.deepEqual([[1,1],[2,2],[3,3]], way.coordinates);
        test.equal(undefined, way.nodes);
        test.done();
    }
    var mongo_way = {_id: {osm: 123}, v: 3, tags: {highway: "racetrack"}};
    var wcon = new WayConverter(collection, mongo_way, callback);
}
