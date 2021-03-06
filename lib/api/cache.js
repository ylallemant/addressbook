/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var options = require('../options.json');
var db      = require('../db/database');
var cache   = require('./cache.json');

/**
 * Holds header name referencing the Etag in requests
 * @type {string}
 */
exports.ETAG_REQUEST_HEADER = 'If-None-Match';

/**
 * Returns the Etag sended with the request or null
 *
 * @param requestContext
 * @returns {string|null}
 */
exports.getEtagValue = function getEtagValue (requestContext) {

  var header = exports.ETAG_REQUEST_HEADER;

  // some browsers do not conform to the standard:
  // header names should be case-sensitive
  var lcHeader = header.toLowerCase();

  if (requestContext.headers[lcHeader]) {
    // your browser sends lower-case header names...
    return requestContext.headers[lcHeader];
  }
  else if (requestContext.headers[header]) {
    // case-sensitive header found
    return requestContext.headers[header];
  }

  return null;
};

/**
 * Checks if a cache entry exists for the
 * current url and etag value
 *
 * @param requestContext
 * @returns {boolean}
 */
exports.check = function check (requestContext, curEtag) {

  var reqEtag = exports.getEtagValue(requestContext);

  // check if caching is enabled, request etag exists
  // and request url exists in cache
  if (reqEtag && cache[requestContext.url] && options.cache) {

    // check if request and current Etags match
    // and if Etag can be found in cache
    if (reqEtag == curEtag && cache[requestContext.url][reqEtag]) {
      // cache available
      if (options.debug) console.log('cache     - found for: url ', requestContext.url, ', etag ', reqEtag);
      return true;
    }
    else {
      // Etag is obsolete, delete the url entry remove it
      delete cache[requestContext.url];
      if (options.debug) console.log('cache     - deleted for: url ', requestContext.url);
    }
  }

  return false;
};

/**
 * Set a cache entry if an url and an etag are provided
 * and response has not already been cached
 *
 * @param responseContext
 */
exports.set = function set (responseContext) {

  if (responseContext.headers.Etag && !responseContext.cached && options.cache) {

    if (!cache[responseContext.url]) {
      // create the url cache structure
      cache[responseContext.url] = {};
    }

    // cache the content
    cache[responseContext.url][responseContext.headers.Etag] = responseContext.data;

    if (options.debug) console.log('cache     - set for: url ', responseContext.url, ', etag ', responseContext.headers.Etag);
  }
};

exports.get = function get (responseContext) {
  responseContext.statusCode = 304;
  responseContext.cached     = true;
  if (options.debug) console.log('cache     - return 304 no change');
};
