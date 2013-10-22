/**
* Test functions for polygon utils
*
* Stefan Wehner 2012
*/

var assert = require('assert');
var PolygonUtils = require('../lib').PolygonUtils;

exports.test_empty_segment = function(test) {
    var s1 = [[]];

    s = PolygonUtils.reduceMembers(s1);
    test.deepEqual([[]],s);
    test.done();
}

var a = [[1,1],[2,2]];
var b = [[2,2],[3,3],[4,4],[1,1]];

exports.test_simple_segment = function(test) {
    var s = [];
    s.push(a.slice(0));

    s = PolygonUtils.reduceMembers(s);
    test.deepEqual([a],s);
    test.done();
}

exports.test_two_segments = function(test) {
    var s = [];
    s.push(a.slice(0));
    s.push(b.slice(0));

    s = PolygonUtils.reduceMembers(s);
    test.equal(1, s.length);
    test.equal(5, s[0].length);
    test.done();
}

var b1 = [[2,2],[3,3],[4,4]];
var b2 = [[4,4],[5,5],[1,1]];

exports.test_three_segments = function(test) {
    var s = [];
    s.push(a.slice(0));
    s.push(b2.slice(0));
    s.push(b1.slice(0));

    s = PolygonUtils.reduceMembers(s);
    test.equal(1, s.length);
    test.equal(6, s[0].length);
    test.done();
}

var r = [[1,1],[5,5],[2,2]];

exports.test_reversed = function(test) {
    var s = [];
    s.push(a.slice(0));
    s.push(r.slice(0));

    s = PolygonUtils.reduceMembers(s);
    test.equal(1, s.length);
    test.equal(4, s[0].length);
    test.done();
}

e = [[7,7],[8,8],[9,9]];

exports.test_one_extra = function(test) {
    var s = [];
    s.push(a.slice(0));
    s.push(e.slice(0));
    s.push(b.slice(0));

    s = PolygonUtils.reduceMembers(s);
    test.equal(2, s.length);
    test.equal(8, s[0].length+s[1].length);
    test.equal(2, Math.abs(s[0].length-s[1].length));
    test.done();
}

var f = [[9,9],[7,7]];

exports.test_two_polygons = function(test) {
    var s = [];
    s.push(a.slice(0));
    s.push(f.slice(0));
    s.push(b2.slice(0));
    s.push(e.slice(0));
    s.push(b1.slice(0));

    s = PolygonUtils.reduceMembers(s);
    test.equal(2, s.length);
    test.equal(10, s[0].length+s[1].length);
    test.equal(2, Math.abs(s[0].length-s[1].length));
    test.done();
}

exports.test_needs_reversal = function(test) {
    var a = [[1,1],[2,2],[3,3]];
    var b = [[1,1],[3,4],[7,8]];
    var s = [a,b];

    var s1 = PolygonUtils.reduceMembers(s);
    test.equal(1, s1.length);
    test.equal(5, s1[0].length);
    test.done();
}


exports.test_remove_first = function(test) {
    s = b.slice(0);

    s = PolygonUtils.removeAtIndex(s,0);
    test.deepEqual([[3,3],[4,4],[1,1]],s);
    test.done();
}

exports.test_remove_middle = function(test) {
    s = b.slice(0);

    s = PolygonUtils.removeAtIndex(s,2);
    test.deepEqual([[2,2],[3,3],[1,1]],s);
    test.done();
}

exports.test_remove_last = function(test) {
    s = b.slice(0);

    s = PolygonUtils.removeAtIndex(s,s.length-1);
    test.deepEqual([[2,2],[3,3],[4,4]],s);
    test.done();
}

exports.test_remove_beyond_last = function(test) {
    s = b.slice(0);

    s = PolygonUtils.removeAtIndex(s,100);
    test.deepEqual([[2,2],[3,3],[4,4],[1,1]],s);
    test.done();
}

