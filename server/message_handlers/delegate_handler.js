"use strict";

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const gameState = require('../game_state');
const gameUtils = require('../db/game_utils');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
const connectRedis = require('../db/redis_connect').connect;
const userDao = require('../db/user_dao');
const _ = require('underscore');
const messages = require('../messages');

let handleUserDelegate = (io, roomNo, userId) => {
  connectRedis().hsetAsync(gameUtils.delegatePlayersKey(roomNo), userId, true);
  io.to(roomNo).emit(messages.SomePlayerDelegate, {roomNo: roomNo, userId: userId});
  return Promise.resolve(true);
}

let delegateHandler = (socket, io) => {
  return (msg, Ack) => {
    msg = JSON.parse(msg);
    
    gameUtils.logNewRequest("Delegate", msg)

    let roomNo = msg.roomNo;
    let userId = msg.userId;

    logger.info("Receive DelegateGame: " + JSON.stringify(msg));

    let setUserDelegate = () => {
      handleUserDelegate(io, roomNo, userId);
    }

    getGame(roomNo)
      .then(setUserDelegate)
      .catch(createFailHandler(Ack));
    
  }
};

module.exports = {
  delegateHandler: delegateHandler,
  handleUserDelegate: handleUserDelegate
}

