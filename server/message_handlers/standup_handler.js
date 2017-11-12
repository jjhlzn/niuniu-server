"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
const gameState = require('../game_state');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

function checkMessage(msg) {
  return null;
}

exports.standupHandler = (socket, io) => {
  return (msg, Ack) => {
    logger.debug("Receive StandUp: " + JSON.stringify(msg));

    //TODO：验证参数的有效性
    if (checkMessage() != null) {
      Ack({status: -1, errorMessage: '参数错误'});
      return;
    }

    let checkGameState = (game) => {
      if (game.state != gameState.BeforeStart) {
        return Promise.reject("游戏开始之后不允许站起");
      }
      return Promise.resolve(game);
    }

    let standup = (game) => {
      return redisClient.hdelAsync(gameUtils.sitdownPlayersKey(game.roomNo), msg.userId)
        .then( delNumber => {
          if (delNumber != 1) {
            return Promise.reject(error);
          }

          return Promise.resolve(true);
        });
    }

    let sendSomePlayerStandupNotify = () => {
      Ack({status: 0});
      io.to(msg.roomNo).emit(messages.SomePlayerStandUp, msg);
    }

    getGame(msg.roomNo)
      .then(checkGameState)
      .then(standup)
      .then(sendSomePlayerStandupNotify)
      .catch(createFailHandler(Ack));
  }

}