
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

    //TODO set file watcher

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

    timestamp = process.hrtime();
    if (options.debug) console.log('loader    - start loading ');

    // create an working copy
    var filesCopy = files.concat([]);

    // load file from all datafiles
    while (filesCopy.length) {

      // load datafile path
      var datafile = filesCopy.pop();

      // read file into "db"
      //handler.status = 'parsing';
      handler.send(datafile);
    }
  }
  else {
    throw new Error("No datafile has been provided");
  }
};

// set message event handler to listen on child process
handler.on('message', function (result) {

  if (result === 'handler:done') {
    var diff = process.hrtime(timestamp);
    if (options.debug) console.log('loader    - stop loading - duration', (diff[0]*1000) + (diff[1]/1000000),'ms');

    // stop child process
    handler.kill();
  }
  else {

    // restore db data
    db.insert(result);
  }
});
