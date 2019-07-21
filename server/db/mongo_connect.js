"use strict";
var MongoClient = require('mongodb').MongoClient
, assert = require('assert');

// Connection URL
var url = null;

if (process.env.NODE_ENV == 'production') {
  url = 'mongodb://jf.yhkamani.com:27017/niuniu';
} else {
  url = 'mongodb://localhost:27017/niuniu';
}
// Use connect method to connect to the Server

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