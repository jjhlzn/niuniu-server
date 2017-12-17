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
  logger.debug(path.resolve('.') + '/clients/index.html');
  res.sendFile(path.resolve('.') + '/clients/index.html');
}