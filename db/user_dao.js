
const _ = require('underscore');
const logger = require('../utils/logger').logger(require('path').basename(__filename));
const connectRedis = require('./redis_connect').connect;
const connectMongo = require('./mongo_connect').mongoConnect;
const closeMongoConnect = require('./mongo_connect').closeMongoConnect;
const gameUtils = require('./game_utils');

function getUser(userId, isDoNothingWhenNotExists) {
  return connectRedis().getAsync(gameUtils.userKey(userId))
    .then( user => {
      if (!user) {
        logger.debug("在Redis中找不到该用户: userId = " + userId + ", 尝试从MongoDB中查找");
        let mongoConn = connectMongo();
        return mongoConn.then( db => {
          return db.collection('users').findOne({userId: userId}).then( user => {
            closeMongoConnect(mongoConn);
            if (!user) {
              if (isDoNothingWhenNotExists) {
                return null;
              }
              else {
                return Promise.reject("MongoDB中找不到该用户, userId = " + userId);
              }
            } else {
              connectRedis().setAsync(gameUtils.userKey(user.userId), JSON.stringify(user));
              return user;
            }
          });
        });
      } else {
        return JSON.parse(user);
      }
    });
}

function getUsers(userIds) {
  let allPromises = userIds.map( userId => this.getUser(userId));
  return Promise.all(allPromises);
}

function setUserInGame(userId, game) {
  logger.debug("setUserInGame is called, userId = " + userId + ", roomNo = " + game.roomNo);
  return setUserRoomInfo(userId, game, game.roomNo);
}

function setUserLeaveGame(userId, game) {
  logger.debug("setUserLeaveGame is called");
  return setUserRoomInfo(userId, game, "")
}

function setUserRoomInfo(userId, game, currentRoomNo) {
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
  getUsers: getUsers,
  setUserInGame: setUserInGame,
  setUserLeaveGame: setUserLeaveGame
}

