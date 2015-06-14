/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var server  = require('./api/server');
var loader  = require('./file/loader');
var options = require('./options.json');
var db      = require('./db/database');

var port    = 8080;

options.debug = true;

db.createIndex('byGender', 'gender');
db.createIndex('byBirthday', 'birthday');
db.createIndex('byName', 'name');

// get script command line arguments
// ignore the first two (exec name, script path)
var cmdLineArguments = process.argv.slice(2);
var datafileProvided = false;

if (cmdLineArguments.length) {
  // arguments have been provided,
  // loop through then
  while (cmdLineArguments.length) {
    var datafile = cmdLineArguments.pop();

    if (datafile.match(/^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/)) {
      // we have a port
      port = datafile;
      console.log(' - Service Port: ', port);
    }
    else {
      // we have a datafile
      loader.addDataFile(datafile);
      datafileProvided = true;
      console.log(' - Datafile: ', datafile);
    }
  }
}

if (!datafileProvided) {
  // no custom datafiles provided,
  // load data from the demo file
  loader.addDataFile(__dirname + '/../data/addressbook.txt');
}

server.process.listen(port);

// begin loading the datafiles
loader.load();

exports.server = server;
exports.loader = loader;
exports.db     = db;
