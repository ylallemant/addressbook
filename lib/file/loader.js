/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var fs        = require('fs');
var path      = require('path');
var cp        = require('child_process');
var handler   = cp.fork('./lib/file/handler');
var db        = require('../db/database');
var options   = require('../options.json');

// datafile path collection
var files     = [];

// hold the timestamp for the load benchmark
var timestamp;

// flag to
var processingChanges = false;

/**
 * Datafile change handler: increments the load version for this datafile
 * requests the processing of the file by the child process
 *
 * @param datafile
 */
exports.loadOnChange = function loadOnChange (datafile) {
  if (options.debug) console.log('loader    - start loading changes to ', datafile);

  // set change processing flag
  processingChanges = true;

  // set processing start timestamp
  timestamp = process.hrtime();

  // increment datafile load version
  db.prepareImport(datafile);

  // send datafile path to child process
  handler.send(datafile);
};

/**
 * Returns true if the datafile exists and is readable
 *
 * @param {string} datafile absolute path to the datafile
 *
 * @returns {boolean}
 */
exports.checkDatafile = function checkDatafile (datafile) {
  if (datafile !== null && fs.existsSync(datafile)) {

    // check process read rights
    fs.accessSync(datafile, fs.R_OK);

    // set file watcher
    fs.watchFile(datafile, (function eventHandlerConstructor (datafile) {
      return function onFileChange (curr, prev) {
        console.log(curr.mtime, prev.mtime, ' => ', (curr.mtime !== prev.mtime));
        if (curr.mtime !== prev.mtime)  {
          exports.loadOnChange(datafile);
        }
      };
    })(datafile));

    // no error was thrown
    return true;
  }
  else {
    throw new Error('You have to provide a path to an existing datafile - path: ' + datafile);
  }
};

/**
 * Adds a datafile to the file collection if it is not already in it and readable
 *
 * @param {string} datafile absolute path to the datafile
 */
exports.addDataFile = function addDataFile (datafile)  {

  // sanitize path
  datafile = path.normalize(datafile);

  // check if provided path references a valid datafile
  if (files.indexOf(datafile) < 0 && exports.checkDatafile(datafile)) {

    // add it to the file collection
    files.push(datafile);

    if (options.debug) console.log('loader    - added datafile ', datafile);
  }
};

/**
 * Triggers the loading of the data from the datafiles
 * this import is done in a child process in order to avoid
 * the blocking of the main process
 *
 * @throws an error if no datafile has been added
 */
exports.load = function load () {

  // check if datafile paths have been added
  if (files.length) {

    // set processing start timestamp
    timestamp = process.hrtime();
    if (options.debug) console.log('loader    - start loading ');

    // create an working copy
    var filesCopy = files.concat([]);

    // load file from all datafiles
    while (filesCopy.length) {

      // load datafile path
      var datafile = filesCopy.pop();

      // increment datafile load version
      db.prepareImport(datafile);

      // read file into "db"
      //handler.status = 'parsing';
      handler.send(datafile);
    }
  }
  else {
    throw new Error("No datafile has been provided");
  }
};

/**
 * Set message event handler to listen on child process
 */
handler.on('message', function (result) {

  if (typeof result === 'string') {
    var diff = process.hrtime(timestamp);
    if (options.debug) console.log('loader    - stop loading - duration', (diff[0]*1000) + (diff[1]/1000000),'ms');

    if (processingChanges) {
      // update entry in database
      db.closeImport(result);
    }
  }
  else {

    if (processingChanges) {
      // update entry in database
      db.update(result);
    }
    else {
      // insert entry into database
      db.insert(result);
    }
  }
});

/**
 * Process EXIT event handler: on exit, the child process has to be terminated
 */
process.on('exit', function exitHandler () {

  // remove child process
  handler.kill();
});
