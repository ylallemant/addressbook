/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var crypto      = require('crypto');
var indexer     = require('./indexer');
var db          = require('./data.json');
var options     = require('../options.json');

exports.getRevision = function getRevision () {
  return db.revision;
};

exports.view = function view (indexName, indexValue) {
  if (!db.indexes[indexName]) {
    throw new Error('Index "' + indexName + '" does not exist in database');
  }

  if (!indexValue) {
    if (options.debug) console.log('database  - get keys for index: ', indexName);
    return Object.keys(db.indexes[indexName]);
  }
  else if (db.indexes[indexName][indexValue]) {
    if (options.debug) console.log('database  - get entries for: index', indexName, 'value', indexValue);
    return db.indexes[indexName][indexValue];
  }
  else {
    return [];
  }
};

/**
 * Generates an unique ID for the provided {@link AddressBookEntry} Object if it is missing
 * the generated UID is an SHA1 string.
 *
 * @param {AddressBookEntry} entry
 * @param {boolean} [force] forces the generation of the UID even if it exists
 *
 * @returns {string} the entry's unique ID
 */
exports.getUID   = function getUID (entry, force) {

  // generate uid only when missing or forcing
  if (!entry.uid || force) {

    // delete uid property before calculating hash
    delete entry.uid;

    // create an unique ID with an SHA1 hash
    var shasum = crypto.createHash('sha1');
    shasum.update(JSON.stringify(entry));

    // add uid property
    entry.uid = shasum.digest('hex').toString();
  }

  return entry.uid;
};

/**
 * Inserts a new entry in the database
 *
 * @param {AddressBookEntry} entry
 */
exports.insert = function insert (entry) {

  // set entry unique ID
  exports.getUID(entry);

  // check for possible duplicate
  if (db.indexes[indexer.INDEX_BYID][entry.uid]) {
    // entry is a duplicate
    //TODO log to error file
    if (options.debug) console.warn('database  - UID ', entry.uid, 'IS A DUPLICATE');
  }
  else {

    // add entry to data
    var arrayPosition = db.data.push(entry) - 1;

    // add id index with entry object reference
    db.indexes[indexer.INDEX_BYID][entry.uid] = db.data[arrayPosition];

    indexer.insertTrigger(entry, arrayPosition);

    // increment the revision number
    db.revision += 1;
    if (options.debug) console.log('database  - inserted and indexed UID ', entry.uid, 'revision', db.revision);
  }
};

/**
 * Triggers the creation of an index in the database
 *
 * @param {string} indexName name of the index
 * @param {string} propertyName name of the property which values will used for {@link AddressBookEntry} Object collections in the index
 */
exports.createIndex = function createIndex (indexName, propertyName) {
  indexer.registerIndex(indexName, propertyName);
};
