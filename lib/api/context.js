/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var options     = require('../options.json');

/**
 * holds information about the current response
 *
 * @param {http.ServerResponse} res response object
 *
 * @constructor
 */
exports.ResponseContext = function ResponseContext (res) {
  this.headers      = {"Content-Type":'application/json; charset=utf-8'};
  this.statusCode   = 200;

  this.response = res;
};

/**
 * holds information about the current request
 *
 * @param {http.IncomingMessage} req request object
 * @param {UrlInfo} parsedUrl
 * @constructor
 */
exports.RequestContext = function RequestContext (req, parsedUrl) {
  this.query     = parsedUrl.query;
  this.path      = parsedUrl.path;
  this.pathNodes = (this.path ? this.path.split('/') : []);
  this.url       = req.url;
  this.headers   = req.headers;
};
