/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var crypto      = require('crypto');
var indexer     = require('./indexer');
var db          = require('./data.json');
var options     = require('../options.json');

/**
 * Returns the database revision number reflecting all the changes to the data
 * the value gets incremented on any insert, update, delete, create index, update index
 *
 * @returns {number}
 */
exports.getRevision = function getRevision () {
  return db.revision;
};

/**
 * Returns the count of entries stored in the database
 * @returns {number}
 */
exports.getEntryCount = function getEntryCount () {
  return db.data.length;
};

/**
 * Prepares a datafile import:
 * - set source import number
 * - clone source entries in a imports area
 *
 * @param {string} source absolute path to the datafile
 */
exports.prepareImport = function prepareImport (source) {

  if (db.sources[source]) {
    // increment source entry
    db.sources[source] += 1;

    // clone bySource index into imports area
    if (db.indexes.bySource[source]) {
      db.imports[source] = db.indexes.bySource[source].slice();
    }
    else {
      db.imports[source] = [];
    }
  }
  else {
    // initialise source entry
    db.sources[source] = 1;
  }
};

/**
 * Returns either an array of index values or an array of {@link AddressBookEntry} Objects
 * - if only indexName was provided a list of all indexed property values is returned
 * - if both parameters were provided a list of all {@link AddressBookEntry} Objects sharing the same property value is returned
 * - if the index value is unknown, an empty array is returned
 *
 * @param {string} indexName index to be queried
 * @param {string} [indexValue] requesting entries sharing this value
 *
 * @throws an error is thrown if the requested index name does not exists
 *
 * @returns {string[] | AddressBookEntry[]}
 */
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
  if (!entry.__uid || force) {

    // delete uid property before calculating hash
    delete entry.__uid;

    // create an unique ID with an SHA1 hash
    var shasum = crypto.createHash('sha1');
    shasum.update(JSON.stringify(entry));

    // add uid property
    entry.__uid = shasum.digest('hex').toString();
  }

  return entry.__uid;
};

/**
 * Inserts a new entry in the database
 *
 * @param {AddressBookEntry} entry
 *
 * @returns {boolean | AddressBookEntry} whether or not an insert has been performed,
 * if yes it returns the stored object, if no it returns false
 */
exports.insert = function insert (entry) {
  var wasInserted = false;

  // set entry unique ID
  exports.getUID(entry);

  // check for possible duplicate
  if (db.indexes[indexer.INDEX_BYID][entry.__uid]) {

    // entry is a duplicate
    if (options.debug) console.warn('database  - UID ', entry.__uid, 'IS A DUPLICATE');

    // increment the entry's load version
    db.indexes[indexer.INDEX_BYID][entry.__uid].__version += 1;
  }
  else {
    // first load version of the entry object
    entry.__version = db.sources[entry.__source];
    entry.__refs    = {};

    // add entry to data
    entry.__refs.arrayPosition = db.data.push(entry) - 1;

    // add id index with entry object reference
    db.indexes[indexer.INDEX_BYID][entry.__uid] = db.data[entry.__refs.arrayPosition];

    // index the new entry
    indexer.insertTrigger(entry);
    if (options.debug) console.log('database  - inserted and indexed UID ', entry.__uid, 'revision', db.revision);

    // insert has been performed
    wasInserted = entry;
  }

  // increment the revision number
  db.revision += 1;

  return wasInserted;
};

/**
 * Removes an entry from the database: deleting it from
 * the main data array and all other collection like indexes
 *
 * @param {AddressBookEntry} entry
 */
exports.remove = function remove (entry) {

  // get index names from references
  // ignore first name: arrayPosition (no index)
  var indexeNames = Object.keys(entry.__refs).slice(1);
  var reference;
  var index;

  // iterate through indexes
  indexeNames.forEach(function indexIterator (indexName) {
    reference = entry.__refs[indexName];

    if (db.indexes[indexName][reference[0]]) {

      index = indexer.indexOf(db.indexes[indexName][reference[0]], entry);

      // remove entry from index value array
      db.indexes[indexName][reference[0]].splice(index, 1);

      if (!db.indexes[indexName][reference[0]].length) {
        // value array is empty: delete it
        delete db.indexes[indexName][reference[0]];
      }

      // increment the revision number
      db.revision += 1;
    }
  });

  // remove byId index
  delete db.indexes.byId[entry.__uid];

  // remove entry from data array
  index = indexer.indexOf(db.data, entry);
  db.data.splice(index, 1);

  // increment the revision number
  db.revision += 1;

  if (options.debug) console.log('database  - removed UID ', entry.__uid, 'revision', db.revision);
};

/**
 * Updates are data imports triggered after a datafile change
 * the update functions calls insert and checks if the value
 * has been inserted.
 * If not, then they are duplicates and have to be removed
 * from the imports array.
 * At the end of the import process, only deleted entries
 * will still be in the imports area
 *
 * @param {AddressBookEntry} rawEntry
 */
exports.update = function update (rawEntry) {
  var isDuplicate = !exports.insert(rawEntry);

  if (isDuplicate) {

    // use the raw entry uid to retrieve the stored object
    var entry = db.indexes.byId[rawEntry.__uid];

    // retrieve the array index from the __refs
    var index = indexer.indexOf(db.indexes.bySource[entry.__source], entry);

    // nullify the entry from the imports area
    db.imports[entry.__source][index] = null;
  }
};

/**
 * At the end of import processes, the entries remaining in the
 * imports area are entries that were removed from the datafile
 * they have to be removed from the database
 *
 * @param {string} source absolute path to the datafile
 */
exports.commit = function commit (source) {

  // loop through the imports array
  while (db.imports[source].length) {
    var entry = db.imports[source].pop();

    if (entry !== null && entry !== undefined) {
      // delete entry
      exports.remove(entry);
    }
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

// creates a source index with reserved property "__source"
exports.createIndex('bySource', '__source');
