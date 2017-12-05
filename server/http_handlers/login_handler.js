"use strict";

const gameState = require('../game_state');
const connectRedis = require('../db/redis_connect').connect;
const mongoConnect = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;
const gameUtils = require('../db/game_utils');
const getGame = require('../message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const moment = require('moment');

function getRandomUserId() {
  let part2 = Math.round( Math.random() * 10000000  % 100000 );
  let part1 = 200000;
  return part1 + part2;
}

function generateUserId(mongoConnection, count) {
  let userId = getRandomUserId();
  return mongoConnection.then( db => {
    return db.collection('users').findOne({userId: userId}).then( user => {
      if (user) {
        if (count > 5)
            return Proise.reject("generateUserId(): 无法找到一个有效的usrId");
        else
          return generateUserId(mongoConnection, count + 1);
      } else {
        return userId;
      }
    })});
}

exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("reqJson: " + JSON.stringify(json));
  let mongoConnection = mongoConnect();
  let redisClient = connectRedis();

  let checkUserExists = (json) => {

    return mongoConnection.then(db => {
      return db.collection('users').findOne({unionid: json.unionid}).then( user => {
          if (!user) {
            return {exists: false}
          }
          else {
            return {exists: true, user: user}
          }
        })
    })
  }

  let createUserIfNeed = (checkResult) => {
    if (!checkResult.exists) {
      return generateUserId(mongoConnection, 0).then( newUserId => {
        return mongoConnection.then(db =>{
          return db.collection('users').insertOne(_.extend({userId: newUserId, createTime: moment().format('YYYY-MM-DD HH:mm:ss')}, json))
            .then( result => {
              if (result.result.ok != 1) {
                return Promise.reject("createUserIfNeed：创建用户失败");
              }
              return _.extend({userId: newUserId}, json);
            });
        })
      });
    } else {
      return checkResult.user;
    }
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
      })
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
    .then(createUserIfNeed)
    .then(sendResponse)
    .then(setRedis)
    .then(done)
    .catch(failHandler);
  
}