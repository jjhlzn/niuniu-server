
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

let deleteGameFromRedis = (game) => {
  if (game.roomNo == '123456')
    return;

  let resetGame = (game) => {
    return redisClient.delAsync(gameUtils.gameKey(game.roomNo));
  }

  let resetSitdownPlayers = (game) => {
    return redisClient.delAsync(gameUtils.sitdownPlayersKey(game.roomNo));
  }
  
  let resetRobBankers = (game) => {
    return redisClient.delAsync(gameUtils.robBankersKey(game.roomNo));
  }
  
  let resetBetPlayers = (game) => {
    return redisClient.delAsync(gameUtils.betPlayersKey(msg.roomNo));
  }
  
  let resetShowCardPlayers = (game) => {
    return redisClient.delAsync(gameUtils.showcardPlayersKey(game.roomNo));
  }
  
  let resetReadyPlayers = (game) => {
    return redisClient.delAsync(gameUtils.readyPlayersKey(game.roomNo));
  }

  return Promise.all([resetGame, resetSitdownPlayers, resetRobBankers, resetBetPlayers, resetShowCardPlayers, resetReadyPlayers]);
}




let saveGameRecord = (game) => {
  let mongoConnection = connectMongo();
  return mongoConnection.then(db =>{
    return db.collection('game_records').insertOne(game)
      .then( result => {
        if (result.result.ok != 1) {
          return Promise.reject("保存游戏历史记录失败：roomNo = " + game.roomNo);
        } else {
          //把redis中用户数据清空
          return deleteGameFromRedis(game)
        }
      });
  })
}



module.exports = {
  getSitPlayerIds: getSitPlayerIds,
  getGame: getGame,
  saveGameRecord: saveGameRecord
}

