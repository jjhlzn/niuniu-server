"use strict";
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/niuniu';
// Use connect method to connect to the Server

/*
MongoClient.connect(url, function(err, db) {
 assert.equal(null, err);
 console.log("Connected correctly to server");

 // Insert a single document
 db.collection('inserts').insertOne({a:1}, function(err, r) {
   assert.equal(null, err);
   assert.equal(1, r.insertedCount);

   // Insert multiple documents
   db.collection('inserts').insertMany([{a:2}, {a:3}], function(err, r) {
     assert.equal(null, err);
     assert.equal(2, r.insertedCount);

     db.close();
   });
 });
}); */

module.exports = { 
  mongoConnect: () => {
    return MongoClient.connect(url);
  },

  closeMongoConnect: (connection) => {
    connection.then( db => {
      db.close();
    });
  }
}