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

    // update database revision
    db.revision += 1;
    if (options.debug) console.log('indexer   - created index', indexName);
  }
};

/**
 * Updates the specified index using the provided database entries
 * the entries will be referenced in the index structure directly
 *
 * @param {AddressBookEntry[]} entries list of entries to be indexed
 * @param {IndexInfo} indexInfo information about the index to be updated
 */
exports.updateIndex = function updateIndex (entries, indexInfo) {

  if (entries && indexInfo) {

    if (!db.indexes[indexInfo.name]) {
      exports.createIndex(indexInfo.name);
    }

    entries.filter(function indexFilter (entry) {

      var key = entry[indexInfo.property];

      if (!db.indexes[indexInfo.name][key]) {
        // create key array
        db.indexes[indexInfo.name][key] = [];
      }

      // references the data entry in the key array
      var indexPosition = db.indexes[indexInfo.name][key].push(db.data[entry.__refs.arrayPosition]) - 1;

      // store index position in __refs
      entry.__refs[indexInfo.name] = [key, indexPosition];

      // update database revision
      db.revision += 1;
    });

  }
};

/**
 * Returns the position of the entry in the array
 *
 * @param {AddressBookEntry[]} index array of entries to be searched
 * @param {{AddressBookEntry} entry to be found
 *
 * @returns {number}
 */
exports.indexOf = function indexOf (index, entry) {
  return index.map(function (e) {
    return e.__uid;
  }).indexOf(entry.__uid);
};

/**
 * Triggers the indexing of new entries.
 *
 * @param {AddressBookEntry} entry entry to be indexed
 */
exports.insertTrigger = function insertTrigger (entry) {

  indexes.forEach(function indexIterator (indexInfo) {
    exports.updateIndex([entry], indexInfo);
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
 * @param {string} indexName name of the index
 * @param {string} property {@link AddressBookEntry} property used as an index key
 */
function IndexInfo (indexName, property) {
  this.name     = indexName;
  this.property = property;
}
