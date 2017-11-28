
const _ = require('underscore');

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const connectRedis = require('../db/redis_connect').connect;
const connectMongo = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;
const gameUtils = require('./game_utils');

function getUser(userId) {

  
  return connectRedis().getAsync(gameUtils.userKey(userId))
    .then( user => {
      if (!user) {
        logger.debug("在Redis中找不到该用户: userId = " + userId + ", 尝试从MongoDB中查找");
        let mongoConn = connectMongo();
        return mongoConn.then( db => {
          return db.collection('users').findOne({userId: userId}).then( user => {
            closeMongoConnect(mongoConn);
            if (!user) {
              return Promise.reject("MongoDB中找不到该用户, userId = " + userId);
            }
            
            connectRedis().setAsync(gameUtils.userKey(user.userId), JSON.stringify(user));
            return user;
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

module.exports = {
  getUser: getUser,

  getUsers: getUsers
}

