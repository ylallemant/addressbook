/* jshint node:true */
/* jshint expr:true*/
/* global describe */
/* global it */
'use strict';

require('chai').should();

var context = require('../../lib/api/context');

describe('Server - Context Lib:', function() {

  describe('should have a constructor "ResponseContext"', function () {
    context.should.have.property('ResponseContext');
    context.ResponseContext.should.be.a('function');

    var response = 'test response';

    var responseContext = new context.ResponseContext(response);

    it('should have a property "headers"', function(){
      responseContext.should.have.property('headers');
      responseContext.headers.should.be.an('object');
    });

    it('should have a header "Content-Type" equaling "application/json; charset=utf-8"', function(){
      responseContext.headers.should.have.property('Content-Type');
      responseContext.headers['Content-Type'].should.be.a('string');
      responseContext.headers['Content-Type'].should.equal('application/json; charset=utf-8');
    });

    it('should have a property "response"', function(){
      responseContext.should.have.property('response');
      responseContext.response.should.be.a('string');
      responseContext.response.should.equal(response);
    });

    it('should have a property "statusCode"', function(){
      responseContext.should.have.property('statusCode');
      responseContext.statusCode.should.be.a('number');
      responseContext.statusCode.should.equal(200);
    });

    it('should have a method "getBody"', function(){
      responseContext.should.have.property('getBody');
      responseContext.getBody.should.be.a('function');
    });

    it('should return a stringified Object for Objects', function(){
      responseContext.data = {test:true};
      responseContext.getBody().should.equal('{"test":true}');
    });

    it('should return a string without changes', function(){
      responseContext.data = 'my little test';
      responseContext.getBody().should.equal('my little test');
    });

    it('should return an empty string if property data is not set', function(){
      delete responseContext.data;
      responseContext.getBody().should.equal('');
    });
  });

  describe('should have a constructor "RequestContext"', function () {
    context.should.have.property('RequestContext');
    context.RequestContext.should.be.a('function');

    var request = {
      url: '/questions/1/?test=true',
      headers: {
        Accept: 'application/json'
      }
    };

    var urlInfo = {
      query: {test:true},
      path: 'questions/1'
    };

    var requestContext = new context.RequestContext(request, urlInfo);

    it('should have a property "url"', function(){
      requestContext.should.have.property('url');
      requestContext.url.should.be.an('string');
      requestContext.url.should.equal(request.url);
    });

    it('should have a property "headers"', function(){
      requestContext.should.have.property('headers');
      requestContext.headers.should.be.an('object');
      requestContext.headers.should.deep.equal(request.headers);
    });

    it('should have a property "query"', function(){
      requestContext.should.have.property('query');
      requestContext.query.should.be.an('object');
      requestContext.query.should.deep.equal(urlInfo.query);
    });

    it('should have a property "path"', function(){
      requestContext.should.have.property('path');
      requestContext.path.should.be.an('string');
      requestContext.path.should.equal(urlInfo.path);
    });

    it('should have a property "pathNodes"', function(){
      requestContext.should.have.property('pathNodes');
      requestContext.pathNodes.should.be.an('array');
      requestContext.pathNodes.should.deep.equal(urlInfo.path.split('/'));
    });

    it('on empty "path" property, "pathNodes" should be an empty array', function(){

      // check handling of missing path information
      urlInfo = {
        query: {test:true}
      };

      requestContext = new context.RequestContext(request, urlInfo);

      requestContext.should.have.property('pathNodes');
      requestContext.pathNodes.should.be.an('array');
      requestContext.pathNodes.should.deep.equal([]);
    });
  });
});
