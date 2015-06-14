/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var fs        = require('fs');
var readline  = require('readline');
var parser    = require('./parser');

/**
 * Handler processing lines found in the opened files
 * if the line could successfully be parsed,
 * the resulting {@link AddressBookEntry} Object is sended to the parent process
 *
 * @param {string} line
 * @param {string} source absolute path of the source datafile
 */
exports.onLine = function onLine (line, source) {

  // ignore empty lines
  if (line.length) {

    // transform text line into JSON entry
    var entry = parser.parseLine(line, source);

    if (entry === null) {
      //TODO invalid line handler
    }
    else {

      // send entry to the parent process
      process.send(entry);
    }
  }
};

/**
 * Opens a read stream to parse the provided file line by line
 * when the file has entirely been read, a "done" message is sended to the parent process
 *
 * @param {string} datafile absolute path to the datafile
 */
exports.read = function read (datafile) {

  // create a stream for the data - more performance on large files
  var fileStream = fs.createReadStream(datafile, {
    encoding: 'utf8'
  });

  // we want to read the stream line by line
  var lineStream = readline.createInterface({
    input: fileStream
  });

  // set line handler
  lineStream.on('line', (function lineHandlerConstructor (datafile) {
    return function lineHandler (line) {
      exports.onLine(line, datafile);
    };
  })(datafile));

  // EOF handler
  fileStream.on('end', function closeStreams () {

    // closing both streams
    lineStream.close();
    fileStream.destroy();

    // send "processing end" status
    // any string would do, but we send the datafile path
    process.send(datafile);
  });
};

// set message event handler to listen on parent process
process.on('message', exports.read);
