"use strict";

var url = require('url');
var querystring = require('querystring');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
/*
   reqJson = {
      userId:  ''
   }
*/

exports.handle = (req, res) => {
  //res.send('Hello World');
  logger.debug("req.query: ", JSON.stringify(req.url.query));
  res.setHeader('Content-Type', 'application/json');

  var params = querystring.parse(url.parse(req.url).query);

  let jsonStr = params['req'];
  let json = JSON.parse(jsonStr);
  logger.debug("userId: " + json.userId);

  let resp = {
    userId: json.userId,
    isInGame: false,
    roomNo: "123456",
    serverUrl: "http://localhost:3000"
  };

  res.end(JSON.stringify(resp));
}