"use strict";

const connectRedis = require('../../db/redis_connect').connect;
const gameUtils = require('../../db/game_utils');
const messages = require('../messages');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
const gameState = require('../../game_state');
var path = require('path');
const logger = require('../../utils/logger').logger(path.basename(__filename));
const userDao = require('../../db/user_dao');


exports.standupHandler = (socket, io) => {
  return (msg, Ack) => {
    msg = JSON.parse(msg);
    gameUtils.logNewRequest("Standup", msg)

    let redisClient = connectRedis();

    let checkGameState = (game) => {
      if (game.state != gameState.BeforeStart) {
        return Promise.reject("游戏开始之后不允许站起");
      }
      return game;
    }

    let standup = (game) => {
      return redisClient.hdelAsync(gameUtils.sitdownPlayersKey(game.roomNo), msg.userId)
        .then( res => {
          return game;
        });
    }

    let setUserLeaveGame = (game) => {
      return userDao.setUserLeaveGame(msg.userId, game);
    }

    let sendSomePlayerStandupNotify = () => {
      Ack({status: 0});
      io.to(msg.roomNo).emit(messages.SomePlayerStandUp, msg);
    }

    getGame(msg.roomNo)
      .then(checkGameState)
      .then(standup)
      .then(setUserLeaveGame)
      .then(sendSomePlayerStandupNotify)
      .catch(createFailHandler(Ack));
  }

}