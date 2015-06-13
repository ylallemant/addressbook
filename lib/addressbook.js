/* jshint node:true */
'use strict';

var server  = require('./api/server');
var loader  = require('./file/loader');
var options = require('./options.json');
var db      = require('./db/database');

options.debug = true;

db.createIndex('byGender', 'gender');
db.createIndex('byBirthday', 'birthday');
db.createIndex('byName', 'name');

server.process.listen(8080);

loader.addDataFile(__dirname + '/../data/addressbook.txt');
loader.load();
