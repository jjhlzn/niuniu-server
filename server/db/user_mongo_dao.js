const _ = require('underscore');

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const redisClient = require('../db/redis_connect').connect();

exports.getUser = (unionid) => {
  return redisClient.getAsync()
}