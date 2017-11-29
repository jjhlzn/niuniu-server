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

let handleUserNotDelegate = (io, roomNo, userId) => {
    connectRedis().hdelAsync(gameUtils.delegatePlayersKey(roomNo), userId);
    io.to(roomNo).emit(messages.SomePlayerNotDelegate, {roomNo: roomNo, userId: userId});
    return Promise.resolve(true);
}

let notDelegateHandler = (socket, io) => {
  return (msg, Ack) => {
    let roomNo = msg.roomNo;
    let userId = msg.userId;

    logger.debug("Receive NotDelegateGame: " + JSON.stringify(msg));

    let setUserNotDelegate = () => {
      handleUserNotDelegate(io, roomNo, userId);
    }

    getGame(roomNo)
      .then(setUserNotDelegate)
      .catch(createFailHandler(Ack));
  }
};

module.exports = {
  notDelegateHandler: notDelegateHandler,
  handleUserNotDelegate: handleUserNotDelegate
}

