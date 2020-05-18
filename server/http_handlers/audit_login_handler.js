"use strict";

const gameState = require('../game_state');
const connectRedis = require('../db/redis_connect').connect;
const gameUtils = require('../db/game_utils');
const getGame = require('../message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const mongoConnect = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;

/**
 * 用于iOS审核版本的登陆
 * @param {*} req 
 * @param {*} res 
 */
exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("reqJson: " + JSON.stringify(json));
  let mongoConnection = mongoConnect();
  let redisClient = connectRedis();

  let checkUserExists = (json) => {
    return mongoConnection.then(db => {
      return db.collection('users').findOne({userId: json.username}).then( user => {
          if (!user || json.password != "123456") {
            return Promise.reject("该用户ID不存在")
          }
          else {
            return user;
          }
        })
    })
  }

  let sendResponse = (user) => {
    res.end(JSON.stringify(_.extend({status: 0}, user)));;
    return user;
  }

  let setRedis = (user) => {
    redisClient.existsAsync( gameUtils.userKey(user.userId) )
      .then( res => {
        if (!res) {
          redisClient.setAsync(gameUtils.userKey(user.userId), JSON.stringify(user));
        }
      } )
  }

  let done = () => {
    closeMongoConnect(mongoConnection);
  }

  let failHandler = (error) => {
    logger.error("ERROR: " +  error);
    closeMongoConnect(mongoConnection);
    return res.end(JSON.stringify({status: -1, errorMessage: '登陆失败'}));
  }

  checkUserExists(json)
    .then(sendResponse)
    .then(setRedis)
    .then(done)
    .catch(failHandler);
  
}