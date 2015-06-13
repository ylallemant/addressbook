/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var options = require('../options.json');
var db      = require('./data.json');

var indexes = [];

/**
 * Name of the standard {@link AddressBookEntry} unique ID index
 * @constant
 * @type {string}
 */
exports.INDEX_BYID = 'byId';

/**
 * Creates the data structure for an index - if needed
 *
 * @param {string} indexName
 */
exports.createIndex = function createIndex (indexName) {
  if (!db.indexes[indexName]) {
    db.indexes[indexName] = {};
    if (options.debug) console.log('indexer   - created index', indexName);
  }
};

/**
 * Updates the specified index using the provided database entries
 * the entries will be referenced in the index structure directly
 *
 * @param {AddressBookEntry[]} entries list of entries to be indexed
 * @param {IndexInfo} indexInfo information about the index to be updated
 * @param {number[]} [arrayPositions] alternate database array positions for entries - if not provided, the position in the entries parameter will be used
 */
exports.updateIndex = function updateIndex (entries, indexInfo, arrayPositions) {

  if (entries && indexInfo) {

    if (!db.indexes[indexInfo.name]) {
      exports.createIndex(indexInfo.name);
    }

    entries.filter(function indexFilter (entry, arrayPosition) {

      // load alternate array position if provided
      arrayPosition = (arrayPositions ? arrayPositions[arrayPosition] : arrayPosition);

      var key = entry[indexInfo.property];

      if (!db.indexes[indexInfo.name][key]) {
        // create key array
        db.indexes[indexInfo.name][key] = [];
      }

      // references the data entry in the key array
      db.indexes[indexInfo.name][key].push(db.data[arrayPosition]);
    });

  }
};

/**
 * Triggers the indexing of new entries.
 *
 * @param {AddressBookEntry} entry entry to be indexed
 * @param {number} arrayPosition entry position in the database data array
 */
exports.insertTrigger = function insertTrigger (entry, arrayPosition) {

  indexes.forEach(function indexIterator (indexInfo) {
    exports.updateIndex([entry], indexInfo, [arrayPosition]);
  });
};

/**
 * Register an index in the index information list {@link indexes} as {@link IndexInfo} Object
 * if the index is already registered, the call will be ignored
 *
 * @param {string} indexName name of the index
 * @param {string} property {@link AddressBookEntry} property used as an index key
 */
exports.registerIndex = function registerIndex (indexName, property) {
  var indexInfo = new IndexInfo(indexName, property);

  if (indexes.indexOf(indexInfo) < 0) {

    // add index to the index collection
    indexes.push(indexInfo);

    // create index data structure
    exports.createIndex(indexInfo.name);
  }
};

/**
 * @class
 * @classdesc Object storing information about the index
 * @property {string} indexName name of the index
 * @property {string} property {@link AddressBookEntry} property used as an index key
 *
 * @constructor
 * @param {string} indexName name of the index
 * @param {string} property {@link AddressBookEntry} property used as an index key
 */
function IndexInfo (indexName, property) {
  this.name     = indexName;
  this.property = property;
}
