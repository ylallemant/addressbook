/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

/**
 * holds information about the current response
 *
 * @param {http.ServerResponse} _response response object
 *
 * @constructor
 */
exports.ResponseContext = function ResponseContext (_response) {
  this.headers      = {"Content-Type":'application/json; charset=utf-8'};
  this.statusCode   = 200;

  this.response = _response;
};

/**
 *
 * @returns {string} response body
 */
exports.ResponseContext.prototype.getBody = function getBody () {

  // initialise an empty body
  var body = '';

  // check from generated data
  if (this.data) {
    if (typeof this.data !== 'string') {

      // convert response data form JSON to string
      body = JSON.stringify(this.data);
    }
    else {

      // response data is already a string
      body = this.data;
    }
  }

  return body;
};

/**
 * holds information about the current request
 *
 * @param {http.IncomingMessage} _request request object
 * @param {UrlInfo} _parsedUrl
 * @constructor
 */
exports.RequestContext = function RequestContext (_request, _parsedUrl) {
  this.query     = _parsedUrl.query;
  this.path      = _parsedUrl.path;

  // get path folder list
  this.pathNodes = (this.path ? this.path.split('/') : []);
  this.url       = _request.url;
  this.headers   = _request.headers;
};
