/*
* Run nodeunit tests from node:
* $ node test/index.js
*
* Stefan Wehner (2012)
*/

var reporter = require('nodeunit').reporters.default;

reporter.run(['test']);
