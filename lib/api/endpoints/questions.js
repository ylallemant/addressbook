var options = require('../../options.json');
var db      = require('../../db/database');

exports.responses = [
  function resolveQuestion1 () {
    return '1. How many women are in the address book? <b>response: ' +
      db.view('byGender', 'Female').length + '</b>';
  },
  function resolveQuestion2 () {

    // retrieve the birthday dates and sort them
    var birthdays = db.view('byBirthday').sort();

    // retrieve entries for the oldest date
    var oldest = db.view('byBirthday', birthdays[0]);

    return '2. Who is the oldest person in the address book?  <b>response: ' +
      oldest[0].name + '</b>';
  },
  function resolveQuestion3 () {
    var paul = db.view('byName', 'Bill McKnight')[0];
    var bill = db.view('byName', 'Paul Robinson')[0];

    var paulTime = new Date(paul.birthday);
    var billTime = new Date(bill.birthday);
    var diff     = billTime - paulTime;

    return '3. How many days older is Bill than Paul?  <b>response: ' +
      Math.floor(diff / (1000*60*60*24)) + '</b>';
  }
];

exports.processRequest = function processRequest (requestContext, ResponseContext) {
  ResponseContext.headers['Content-Type'] = 'text/html; charset=utf-8';
  ResponseContext.headers.Etag = db.revision;

  var body = '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="UTF-8">\n    <title>'+
    requestContext.path +'</title>\n  </head>\n  <body>\n';

  if (requestContext.pathNodes.length < 2) {
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
};