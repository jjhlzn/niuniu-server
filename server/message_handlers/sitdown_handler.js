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

//那么用户一旦坐下，则用户的状态设置为在那个房间
exports.sitdownHandler = (socket) => {
  return (msg, Ack) => {
    logger.debug("Receive SitDown: " + JSON.stringify(msg));
    let redisClient = connectRedis();

    let thisGame = {};
    let thisUser = {};

    let checkSeat = (game) => {
      thisGame = game;

      return redisClient.existsAsync(gameUtils.sitdownPlayersKey(msg.roomNo))
        .then( exists => {
          if (!exists) {
            return true;
          } else {
            return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(msg.roomNo)).then(playerHash => {
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
      this.user = user;
      return redisClient.hsetAsync(gameUtils.sitdownPlayersKey(msg.roomNo), msg.userId, msg.seat).then(res => {
        if (!res) {
          return Promise.reject(res);
        } 
        return user;
      });
    }

    let setUserInGame = () => {
      return userDao.setUserInGame(msg.userId, thisGame);
    }

    let sendResponse = () => {
      Ack({status: 0});
      socket.to(msg.roomNo).emit(messages.SomePlayerSitDown, _.extend(msg, thisUser));
    }

 
    getGame(msg.roomNo)
      .then(checkSeat)
      .then(checkUserId)
      .then(sit)
      .then(setUserInGame)
      .then(sendResponse)
      .catch(createFailHandler(Ack));
  }

}