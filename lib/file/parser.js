/* jshint node:true */
/* global require */
/* global exports */
/* global module */
'use strict';

var currentYear = new Date().getYear() - 100;

/**
 * Address Book Entry Class
 * data representation of the text entries
 *
 * @param {string} name full name of the person
 * @param {string} gender
 * @param {string} birthday
 *
 * @constructor
 */
exports.AddressBookEntry = function AddressBookEntry (name, gender, birthday) {
  this.name = name;
  this.gender = gender;
  this.birthday = birthday;
};

/**
 *  regular expression validating and parsing address book text entries
 *
 * @constant
 * @type {RegExp}
 */
exports.ADDRESSBOOK_ENTRY_REGEX = /([\w -]+), (Male|Female), ([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/([0-9]{2})/;

/**
 * Returns an ISO Date out of the parsed time data
 *
 * @param {string} year the correct century (19|20) is added
 * @param {string} month
 * @param {string} day
 *
 * @returns {string} an ISO date like 1978-07-23 or 2015-06-11
 */
exports.getISODate = function getISODate (year, month, day) {

  // set correct century
  var iso = (year <= currentYear ? 20 : 19);

  iso += year;
  iso += '-' + month;
  iso += '-' + day;

  return iso;
};

/**
 * Parses the text lines provided by the loader
 * if the line matches the format defined in {@link ADDRESSBOOK_ENTRY_REGEX},
 * it will be parsed. Otherwise it will be ignore and "null" returned
 *
 * @param {string} line raw text line
 * @returns {(AddressBookEntry|null)}
 */
exports.parseLine = function parseLine (line) {
  var lineArray = line.match(exports.ADDRESSBOOK_ENTRY_REGEX);

  // check entry format
  if (lineArray !== null) {
    var isoDate   = exports.getISODate(lineArray[5], lineArray[4], lineArray[3]);

    // return new entry instance
    return new exports.AddressBookEntry(lineArray[1], lineArray[2], isoDate);
  }

  return null;
};
