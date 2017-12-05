
const _ = require('underscore');

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const connectRedis = require('../db/redis_connect').connect;
const connectMongo = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;
const gameUtils = require('./game_utils');

function getSitPlayerIds(roomNo) {
  logger.debug("getSitPlayerIds is called, roomNo = " + roomNo);
  return connectRedis().hgetallAsync(gameUtils.sitdownPlayersKey(roomNo))
    .then( hash => {
      logger.debug("hash = " + hash);
      if (!hash)
        return [];
      else {
        return _.keys(hash);  
      }
    });
}

let getGame = (roomNo, isDoNothingWhenNotExist) => {
  let redisClient = connectRedis();
  return redisClient.getAsync(gameUtils.gameKey(roomNo))
    .then( res => {
      if (!res) {
        if (isDoNothingWhenNotExist)
          return null;
        else
          return Promise.reject("获取房间出错[roomNo = " + roomNo +"]：res = " + res);
      }
      return JSON.parse(res);
    });
};

module.exports = {
  getSitPlayerIds: getSitPlayerIds,
  getGame: getGame
}

