
const _ = require('underscore');
const logger = require('../utils/logger').logger(require('path').basename(__filename));
const connectRedis = require('../db2/redis_connect').connect;
const connectMongo = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;

const gameUtils = require('../db/game_utils');

async function getUser(userId) {
  let client = connectRedis()
  var user = await client.getAsync(gameUtils.userKey(userId))
  if (!user) {
    logger.debug("Redis中找不到该用户: userId = " + userId + ", 尝试从MongoDB中查找");
    let mongoClient = await connectMongo()
    //console.log(mongoClient.db("users"))
    user = await mongoClient.collection("users").findOne({userId: userId});
    if (!user) {
      return null;
    }
    await client.setAsync(gameUtils.userKey(userId), JSON.stringify(user))
    return user
  } else {
    return JSON.parse(user)
  }
}

async function setUserInGame(userId, game) {
  logger.debug("setUserInGame is called, userId = " + userId + ", roomNo = " + game.roomNo);
  return setUserRoomInfo(userId, game, game.roomNo);
}

async function setUserLeaveGame(userId, game) {
  logger.debug("setUserLeaveGame is called");
  return setUserRoomInfo(userId, game, "")
}

async function setUserRoomInfo(userId, game, currentRoomNo) {
  let redisClient = connectRedis();
  return getUser(userId)
    .then(user => {
      user.currentRoomNo = currentRoomNo;
      return redisClient.setAsync(gameUtils.userKey(userId), JSON.stringify(user))
        .then( res => {
          if (!res) {
            return Promise.reject("在Redis中更新信息失败, userId = " + userId);
          }
          return game;
        });
      }); 
}

module.exports = {
  getUser: getUser,
  setUserInGame: setUserInGame,
  setUserLeaveGame: setUserLeaveGame
}

/*
getUser('test1').then(user => {
  console.log(user)
})*/