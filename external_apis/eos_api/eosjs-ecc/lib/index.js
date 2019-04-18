'use strict';

var commonApi = require('./api_common');
var objectApi = require('./api_object');

var commonApi_r1 = require('./api_common_r1');
var objectApi_r1 = require('./api_object_r1');

var ecc = Object.assign({}, commonApi, objectApi);
var ecc_r1 = Object.assign({}, commonApi_r1, objectApi_r1);

module.exports = {ecc, ecc_r1};
