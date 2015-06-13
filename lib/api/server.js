var http        = require('http');
var exec        = require('child_process').exec;
var querystring = require('querystring');
var options     = require('../options.json');
var cache       = require('./cache');

var ResponseContext = require('./context').ResponseContext;
var RequestContext  = require('./context').RequestContext;

/**
 * An Object containing the information about the url
 *
 * @typedef {Object} UrlInfo
 * @property {String} path
 * @property {Object.<string, string>} query
 */


/**
 * Parses the provided url:
 * - separate path from query
 * - tranform query into hashmap
 *
 * @param {string} rawurl
 *
 * @returns {UrlInfo} url information object
 */
exports.parseUrl = function parseUrl (rawurl) {
  var parts = rawurl.split('?');
  var parsed = {};

  // sanitise the path removing starting and trailing "/"
  parsed.path = parts[0].replace(/((^\/)|(\/$))/g, '');

  if (parts[1]) {
    parsed.query = querystring.parse(parts[1], null, null, {decodeURIComponent:querystring.unescape});
  }
  else {
    parsed.query = {};
  }

  options.debug = (parsed.query.debug === 'true' ? true : false);

  return parsed;
};

/**
 * Build and sends the response using the provided {@link ResponseContext}
 *
 * @param {ResponseContext} responseContext
 */
exports.sendResponse = function sendResponse (responseContext) {

  // if no reason phrase was provided, use the standard one
  var reasonPhrase = (
    responseContext.reasonPhrase ?
      responseContext.reasonPhrase :
      http.STATUS_CODES[responseContext.statusCode]
  );

  // write the response head
  responseContext.response.writeHead(
    responseContext.statusCode,
    reasonPhrase,
    responseContext.headers
  );

  if (options.debug) {
    console.log('-----');
    console.log('server    - response status code: ', responseContext.statusCode);
    console.log('server    - response status message: ', reasonPhrase);
    console.log('server    - response content type: ', responseContext.headers['Content-Type']);
  }

  // initialise an empty body
  var body = '';

  // check from generated data
  if (responseContext.data) {
    if (typeof responseContext.data !== 'string') {

      // convert response data form JSON to string
      body = JSON.stringify(body);
    }
    else {

      // response data is already a string
      body = responseContext.data;
    }
  }

  // send the response to the client
  responseContext.response.end(body);

  // cache the response
  cache.set(responseContext);

  var diff = process.hrtime(responseContext.timestamp);
  if (options.debug) console.log('server    - response - duration', (diff[0]*1000) + (diff[1]/1000000),'ms');
};

/**
 * Handles incoming requests:
 * - check if cached content is available
 * - if not, handles favicon.ico requests
 * - if not, and an path is provided, request processing by the endpoint
 * - if not, redirect to the default endpoint
 *
 * @param {context.RequestContext} requestContext
 * @param {context.ResponseContext} responseContext
 */
exports.requestHandler = function requestHandler (requestContext, responseContext) {

  if (cache.check(requestContext)) {
    responseContext.statusCode = 304;
    responseContext.cached     = true;
    if (options.debug) console.log('server    - valid cache found');
  }
  else {
    if (requestContext.url === '/favicon.ico') {
      responseContext.statusCode = 200;
      responseContext.headers['Content-Type'] = 'image/x-icon';
      if (options.debug) console.log('server    - favicon requested');
    }
    else if (requestContext.pathNodes.length) {
      try {
        var endpoint = require('./endpoints/' + requestContext.pathNodes[0]);

        endpoint.processRequest(requestContext, responseContext);
        if (options.debug) console.log('server    - response from endpoint ./endpoints/' + requestContext.pathNodes[0]);
      }
      catch (error) {
        responseContext.statusCode = 404;
        responseContext.data = {
          reason: 'endpoint "' + requestContext.pathNodes[0] + '" does not exist'
        };
        if (options.debug) console.log('server    - ' + responseContext.data.reason);
      }
    }
    else {
      // redirect user to endpoint "questions"
      responseContext.statusCode = 303;
      responseContext.headers.Location = '/questions';
    }
  }

  exports.sendResponse(responseContext);
};

/**
 * Opens an ulr in the default browser on Windows and OSX
 *
 * @param {string} url location to be opened in the browser
 */
exports.openBrowser = function openBrowser (url) {
  var opener;

  switch (process.platform) {
    case 'darwin':
      opener = 'open';
      break;
    case 'win32':
      opener = 'start ""';
      break;
  }

  return exec(opener + ' "' + url + '"');
};

/**
 * References the server process
 */
exports.process = http.createServer(function (req, res) {
  var parsedUrl       = exports.parseUrl(req.url);
  var requestContext  = new RequestContext(req, parsedUrl);
  var responseContext = new ResponseContext(res);

  responseContext.url = requestContext.url;

  // get timestamp for the benchmark
  responseContext.timestamp = process.hrtime();

  if (options.debug) {
    console.log('----------------------------');
    console.log(new Date().toISOString());
    console.log('server    - url: ' + requestContext.url);
  }

  exports.requestHandler(requestContext, responseContext);
});

// set the listening handler
exports.process.on('listening', function onListening () {
  var port = exports.process._connectionKey.split(':')[2];
  var url  = 'http://localhost:' + port;

  // output server url
  console.log('Server running: ' + url);

  // open browser
  exports.openBrowser(url);
});
