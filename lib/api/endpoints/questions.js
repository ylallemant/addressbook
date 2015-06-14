/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var cache   = require('../cache');
var options = require('../../options.json');
var db      = require('../../db/database');

exports.resolveQuestion1 = function resolveQuestion1 () {
  return '1. How many women are in the address book? <b>response: ' +
    db.view('byGender', 'Female').length + '</b>';
};

exports.resolveQuestion2 = function resolveQuestion2 () {

  // retrieve the birthday dates and sort them
  var birthdays = db.view('byBirthday').sort();

  // retrieve entries for the oldest date
  var oldest = db.view('byBirthday', birthdays[0]);

  return '2. Who is the oldest person in the address book?  <b>response: ' +
    oldest[0].name + '</b>';
};

exports.resolveQuestion3 = function resolveQuestion3 () {
  var question = '3. How many days older is Bill than Paul?  ';
  var paulView = db.view('byName', 'Bill McKnight');
  var billView = db.view('byName', 'Paul Robinson');

  if (!paulView.length && !billView.length) {
    return question + 'both Bill and Paul are missing';
  }
  else if (!paulView.length) {
    return question + 'Paul is missing';
  }
  else if (!billView.length) {
    return question + 'Bill is missing';

  }
  else {
    var paulTime = new Date(paulView[0].birthday);
    var billTime = new Date(billView[0].birthday);
    var diff     = billTime - paulTime;

    return question + '<b>response: ' +
      Math.floor(diff / (1000*60*60*24)) + '</b>';
  }
};

exports.responses = [
  exports.resolveQuestion1,
  exports.resolveQuestion2,
  exports.resolveQuestion3
];

exports.processRequest = function processRequest (requestContext, ResponseContext) {
  ResponseContext.headers.Etag = db.getRevision();

  if (cache.check(requestContext, ResponseContext.headers.Etag)) {
    cache.get(ResponseContext);
  }
  else {
    ResponseContext.headers['Content-Type'] = 'text/html; charset=utf-8';

    var body = '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="UTF-8">\n    <title>'+
      requestContext.path +'</title>\n  </head>\n  <body>\n';

    if (!db.getEntryCount()) {
      // no data is stored in the database
      return '<h1>No data has been imported</h1>';
    }
    else if (requestContext.pathNodes.length < 2) {
      if (options.debug) console.log('questions - output all responses');

      // iterate through all responses
      exports.responses.forEach(function responseIterator(response, index) {
        body += exports.responses[index]();
        body += '\n<br>';
      });
    }
    else if (requestContext.pathNodes[1] < 1 || 3 < requestContext.pathNodes[1]) {
      // redirect user to endpoint "questions"
      ResponseContext.statusCode = 303;
      ResponseContext.headers.Location = '/questions';
      if (options.debug) console.log('questions - response #'+requestContext.pathNodes[1]+' does not exist - redirect to questions');
    }
    else {
      var index = requestContext.pathNodes[1] - 1;
      body += exports.responses[index]();
    }

    body += '\n  </body>\n</html>';

    ResponseContext.data = body;
  }
};