/* jshint node:true */
/* jshint expr:true*/
/* global describe */
/* global it */
'use strict';

require('chai').should();

var http    = require('http');
var raw     = require('../../lib/db/data.json');
var db      = require('../../lib/db/database');

var source  = '/my/little/dungeon';
var male   = {
  name: 'Horned Reaper',
  gender: 'Male',
  birthday: '01/01/666',
  __source: source
};
var female   = {
  name: 'Dark Mistress',
  gender: 'Female',
  birthday: '01/01/666',
  __source: source
};
var stored;

describe('DB - Database Lib:', function() {

  it('should have a method "getRevision"', function() {
    db.should.have.property('getRevision');
    db.getRevision.should.be.a('function');
  });

  it('should have a method "getEntryCount"', function() {
    db.should.have.property('getEntryCount');
    db.getEntryCount.should.be.a('function');
  });

  it('should have a method "prepareImport"', function() {
    db.should.have.property('prepareImport');
    db.prepareImport.should.be.a('function');
  });

  it('should have a method "view"', function() {
    db.should.have.property('view');
    db.view.should.be.a('function');
  });

  it('should have a method "getUID"', function() {
    db.should.have.property('getUID');
    db.getUID.should.be.a('function');
  });

  it('should have a method "insert"', function() {
    db.should.have.property('insert');
    db.insert.should.be.a('function');
  });

  it('should have a method "remove"', function() {
    db.should.have.property('remove');
    db.remove.should.be.a('function');
  });

  it('should have a method "update"', function() {
    db.should.have.property('update');
    db.update.should.be.a('function');
  });

  it('should have a method "closeImport"', function() {
    db.should.have.property('closeImport');
    db.closeImport.should.be.a('function');
  });

  it('should have a method "createIndex"', function() {
    db.should.have.property('createIndex');
    db.createIndex.should.be.a('function');
  });

  describe('should create indexes', function() {
    db.createIndex('byGender', 'gender');

    raw.should.have.property('indexes');
    raw.indexes.should.be.an('object');

    it('byId exists', function () {

      raw.indexes.should.have.property('byId');
      raw.indexes.byId.should.be.an('object');
      Object.keys(raw.indexes.byId).length.should.equal(0);
    });

    it('bySource exists', function () {

      raw.indexes.should.have.property('bySource');
      raw.indexes.bySource.should.be.an('object');
      Object.keys(raw.indexes.bySource).length.should.equal(0);
    });

    it('byGender exists', function () {

      raw.indexes.should.have.property('byGender');
      raw.indexes.byGender.should.be.an('object');
      Object.keys(raw.indexes.byGender).length.should.equal(0);
    });
  });

  describe('should handle initial import', function() {

    it('prepare import of "/my/little/dungeon" source', function() {
      raw.should.have.property('sources');
      raw.sources.should.be.an('object');

      db.prepareImport(source);

      raw.sources.should.have.property(source);
      raw.sources[source].should.be.a('number');
      raw.sources[source].should.equal(1);
    });

    it('store entries', function() {
      raw.should.have.property('data');
      raw.data.should.be.an('array');
      raw.data.length.should.equal(0);

      stored = db.insert(male);
      db.insert(female);

      raw.revision.should.equal(8);
      raw.data.length.should.equal(2);

      Object.keys(raw.indexes.byId).length.should.equal(2);
      Object.keys(raw.indexes.bySource).length.should.equal(1);
      raw.indexes.bySource[source].length.should.equal(2);
      Object.keys(raw.indexes.byGender).length.should.equal(2);
      raw.indexes.byGender.Male.length.should.equal(1);
      raw.indexes.byGender.Female.length.should.equal(1);
    });

    it('adds data to entries', function() {
      stored.should.have.property('__uid');
      stored.__uid.should.be.a('string');
      stored.__uid.should.equal('d7e7098ca2bb0c05d17e71f0b2b1d11e7bba033e');

      stored.should.have.property('__version');
      stored.__version.should.be.a('number');
      stored.__version.should.equal(1);

      stored.should.have.property('__refs');
      stored.__refs.should.be.an('object');

      stored.__refs.should.have.property('arrayPosition');
      stored.__refs.arrayPosition.should.be.a('number');
      stored.__refs.arrayPosition.should.equal(0);

      stored.__refs.should.have.property('bySource');
      stored.__refs.bySource.should.be.a('array');
      stored.__refs.bySource[0].should.equal(source);
      stored.__refs.bySource[1].should.equal(0);

      stored.__refs.should.have.property('byGender');
      stored.__refs.byGender.should.be.a('array');
      stored.__refs.byGender[0].should.equal('Male');
      stored.__refs.byGender[1].should.equal(0);
    });
  });

  describe('should handle subsequent imports', function() {

    it('prepare subsequent import of "/my/little/dungeon" source', function() {
      raw.should.have.property('imports');
      raw.imports.should.be.an('object');

      db.prepareImport(source);

      raw.sources[source].should.equal(2);

      raw.imports.should.have.property(source);
      raw.imports[source].should.be.an('array');
      raw.imports[source].length.should.equal(2);

      raw.imports[source][0].should.deep.equal(raw.data[0]);
      raw.imports[source][1].should.deep.equal(raw.data[1]);
    });


    it('update female', function() {
      raw.data.length.should.equal(2);

      db.update(female);

      raw.data[1].__version.should.equal(2);

      raw.revision.should.equal(9);
      raw.data.length.should.equal(2);

      Object.keys(raw.indexes.byId).length.should.equal(2);
      Object.keys(raw.indexes.bySource).length.should.equal(1);
      raw.indexes.bySource[source].length.should.equal(2);
      Object.keys(raw.indexes.byGender).length.should.equal(2);
      raw.indexes.byGender.Male.length.should.equal(1);
      raw.indexes.byGender.Female.length.should.equal(1);
    });

    it('removes non updated entries: male', function() {
      raw.imports[source].length.should.equal(1);
      raw.imports[source][0].should.deep.equal(raw.data[0]);

      db.closeImport(source);

      raw.data.length.should.equal(1);
      raw.revision.should.equal(12);

      Object.keys(raw.indexes.byId).length.should.equal(1);
      Object.keys(raw.indexes.bySource).length.should.equal(1);
      raw.indexes.bySource[source].length.should.equal(1);
      Object.keys(raw.indexes.byGender).length.should.equal(1);
      raw.indexes.byGender.Female.length.should.equal(1);

      raw.imports[source].length.should.equal(0);
    });
  });
});
