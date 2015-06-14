/* jshint node:true */
/* jshint expr:true*/
/* global describe */
/* global it */
'use strict';

require('chai').should();

var http    = require('http');
var server  = require('../../lib/api/server');
var context = require('../../lib/api/context');

describe('Server - Server Lib:', function() {

  var url = ' /questions/1/?test=true  ';
  var urlInfo = server.parseUrl(url);

  var urlWithoutPath = '  ';
  var urlWithoutPathInfo = server.parseUrl(urlWithoutPath);

  var urlwithoutQuery = ' /questions/1/  ';
  var urlwithoutQueryInfo = server.parseUrl(urlwithoutQuery);

  it('should have a method "parseUrl"', function() {
    server.should.have.property('parseUrl');
    server.parseUrl.should.be.a('function');
  });

  it('should have a method "requestHandler"', function() {
    server.should.have.property('requestHandler');
    server.requestHandler.should.be.a('function');
  });

  it('should have a method "sendResponse"', function() {
    server.should.have.property('sendResponse');
    server.sendResponse.should.be.a('function');
  });

  it('should have a method "openBrowser"', function() {
    server.should.have.property('openBrowser');
    server.openBrowser.should.be.a('function');
  });

  it('should have a method "process"', function() {
    server.should.have.property('process');
    server.process.should.be.an('object');
  });

  describe('method "parseUrl" returns UrlInfo Objects, they', function() {

    it('should have a property "path"', function(){
      urlInfo.should.have.property('path');
      urlInfo.path.should.be.an('string');
      urlInfo.path.should.equal('questions/1');
    });

    it('should have a property "query"', function(){
      urlInfo.should.have.property('query');
      urlInfo.query.should.be.an('object');
      urlInfo.query.should.deep.equal({test:'true'});
    });

    it('should return empty queries as empty Objects', function(){
      urlwithoutQueryInfo.should.have.property('query');
      urlwithoutQueryInfo.query.should.be.an('object');
      urlwithoutQueryInfo.query.should.deep.equal({});
    });

    it('should return url without path as empty string', function(){
      urlWithoutPathInfo.should.have.property('path');
      urlWithoutPathInfo.path.should.be.an('string');
      urlWithoutPathInfo.path.should.equal('');
    });
  });

  describe('should process any request without breaking', function() {

    var responseContext = new context.ResponseContext({});

    it('favicon requests', function(done){
      var requestContext = {
        url: '/favicon.ico'
      };

      responseContext.response.writeHead = function (code, status, headers) {

        code.should.be.a('number');
        code.should.equal(200);

        status.should.be.a('string');
        status.should.equal(http.STATUS_CODES[200]);

        headers.should.have.property('Content-Type');
        headers['Content-Type'].should.be.a('string');
        headers['Content-Type'].should.equal('image/x-icon');
      };

      responseContext.response.end = function (body) {

        body.should.be.an('string');
        body.should.equal('');

        done();
      };

      server.requestHandler(requestContext, responseContext);
    });

    it('empty path redirects to /questions', function(done){
      var requestContext = {
        url: '',
        pathNodes: []
      };

      responseContext.response.writeHead = function (code, status, headers) {

        code.should.be.a('number');
        code.should.equal(303);

        status.should.be.a('string');
        status.should.equal(http.STATUS_CODES[303]);

        headers.should.have.property('Location');
        headers.Location.should.be.a('string');
        headers.Location.should.equal('/questions');
      };

      responseContext.response.end = function (body) {

        body.should.be.an('string');
        body.should.equal('');

        done();
      };

      server.requestHandler(requestContext, responseContext);
    });

    it('request of unknown endpoints', function(done){
      var requestContext = {
        url: '/unknown',
        pathNodes: ['unknown']
      };

      responseContext.response.writeHead = function (code, status, headers) {

        code.should.be.a('number');
        code.should.equal(404);

        status.should.be.a('string');
        status.should.equal(http.STATUS_CODES[404]);
      };

      responseContext.response.end = function (body) {

        body.should.be.an('string');
        body.should.equal('{"reason":"endpoint \\"unknown\\" does not exist"}');

        done();
      };

      server.requestHandler(requestContext, responseContext);
    });
  });
});