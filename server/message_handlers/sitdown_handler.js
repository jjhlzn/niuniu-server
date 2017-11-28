"use strict";

const connectRedis = require('../db/redis_connect').connect;
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const _ = require('underscore');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const userDao = require('../db/user_dao');

exports.sitdownHandler = (socket) => {
  return (msg, Ack) => {
    logger.debug("Receive SitDown: " + JSON.stringify(msg));
    let redisClient = connectRedis();

    let checkSeat = (game) => {
      return redisClient.existsAsync(gameUtils.sitdownPlayersKey(msg.roomNo))
        .then( exists => {
          if (!exists) {
            return true;
          } else {
            return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(msg.roomNo)).then(playerHash => {
              if (!playerHash) {
                return Promise.reject("获取sitdownPlayers失败");
              }

              logger.debug("sitdownPlayes: " +JSON.stringify(playerHash));
              if (playerHash[msg.userId]) {
                return Promise.reject('Player ' + msg.userId + ' has sit down');
              }
      
              let seatNos = _.values(playerHash);
              if (seatNos.filter( seat => {return seat == msg.seat}).length > 0) {
                return Promise.reject('Seat ' + msg.seat + ' has player');
              }

              return true;
            });
          }
        });
    }

    let checkUserId = () => {
      return userDao.getUser(msg.userId);
    }

    let sit = (user) => {
      return redisClient.hsetAsync(gameUtils.sitdownPlayersKey(msg.roomNo), msg.userId, msg.seat).then(res => {
        if (!res) {
          return Promise.reject(res);
        } 
        return user;
      });
    }

    //TODO：检查自己是否已经在该座位上，并且把该用户的信息发送给其他用户：头像链接，nickname, sex。
    let checkSit = (user) => {
      Ack({status: 0});
      socket.to(msg.roomNo).emit(messages.SomePlayerSitDown, _.extend(msg, user));
    }

 
    getGame(msg.roomNo)
      .then(checkSeat)
      .then(checkUserId)
      .then(sit)
      .then(checkSit)
      .catch(createFailHandler(Ack));
  }

}