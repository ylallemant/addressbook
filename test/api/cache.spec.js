/* jshint node:true */
/* jshint expr:true*/
/* global describe */
/* global it */
'use strict';
require('chai').should();
var expect = require('chai').expect;

var cacheLib = require('../../lib/api/cache');
var cache    = require('../../lib/api/cache.json');
var options  = require('../../lib/options.json');

options.debug = false;

describe('Caching Lib:', function(){

  it('should have a property "ETAG_REQUEST_HEADER"', function(){
    cacheLib.should.have.property('ETAG_REQUEST_HEADER');
    cacheLib.ETAG_REQUEST_HEADER.should.be.a('string');
    cacheLib.ETAG_REQUEST_HEADER.should.equal('If-None-Match');
  });

  describe('should have a method "getEtagValue"', function(){
    cacheLib.should.have.property('getEtagValue');
    cacheLib.getEtagValue.should.be.a('function');

    var header   = cacheLib.ETAG_REQUEST_HEADER;
    var lcHeader = header.toLowerCase();
    var headers  = {};

    it('that handles empty headers', function(){
      // check empty header
      expect(cacheLib.getEtagValue({headers:headers})).to.be.null;
    });

    it('that handles case sensitive headers', function(){
      headers[header] = 'test';
      cacheLib.getEtagValue({headers:headers}).should.equal('test');
    });

    it('that handles lower case headers', function(){
      delete headers[header];
      headers[lcHeader] = 'test';
      cacheLib.getEtagValue({headers:headers}).should.equal('test');
    });
  });

  describe('should have a method "set"', function(){
    cacheLib.should.have.property('set');
    cacheLib.set.should.be.a('function');

    var url  = '/Answer/to/the/Ultimate/Question/of/Life/The/Universe/and/Everything';
    var etag = '42';
    var responseContext = {
      headers: {Etag: etag},
      url: url,
      data: 'test',
      cached: false
    };


    it('that ignores on option.cache === false', function(){
      options.cache = false;
      cacheLib.set(responseContext);
      cache.should.not.have.property(url);
    });

    it('that ignores on responseContext.cache === true', function(){
      options.cache          = true;
      responseContext.cached = true;

      cacheLib.set(responseContext);
      cache.should.not.have.property(url);
    });

    it('that stores on responseContext.cache === true', function(){
      responseContext.cached = false;

      cacheLib.set(responseContext);
      cache.should.have.property(url);
      cache[url].should.have.property(etag);
      cache[url][etag].should.be.equal('test');
    });
  });

  describe('should have a method "check"', function(){
    cacheLib.should.have.property('check');
    cacheLib.check.should.be.a('function');

    var url  = '/Answer/to/the/Ultimate/Question/of/Life/The/Universe/and/Everything';
    var etag = '42';
    var requestContext = {
      headers: {},
      url: url
    };

    options.cache = true;

    it('that ignores on empty header', function(){
      expect(cacheLib.check(requestContext)).to.be.false;
    });

    it('that ignores on option.cache === false', function(){
      options.cache = false;
      requestContext.headers[cacheLib.ETAG_REQUEST_HEADER] = etag;
      expect(cacheLib.check(requestContext)).to.be.false;
    });

    it('that ignores unknown url', function(){
      options.cache = true;
      requestContext.url = 'unknown';
      expect(cacheLib.check(requestContext)).to.be.false;
    });

    it('that matches on option.cache=true', function(){
      options.cache = true;
      requestContext.url = url;

      expect(cacheLib.check(requestContext)).to.be.true;
    });

    it('that deletes cache on Etag mismatch', function(){
      options.cache = true;
      requestContext.url = url;
      requestContext.headers[cacheLib.ETAG_REQUEST_HEADER] = 22;

      expect(cacheLib.check(requestContext)).to.be.false;
      cache.should.not.have.property(url);
    });
  });
});