"use strict";

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const gameState = require('../game_state');
const gameUtils = require('../db/game_utils');
const getGame = require('./share_functions').getGame;
const messages = require('../messages');
const createFailHandler = require('./share_functions').createFailHandler;
const redisClient = require('../db/redis_connect').connect();
const _ = require('underscore');

//离开房间
exports.leaveRoomHandler = (socket, io) =>  {
  return (msg, Ack) => {
    msg = JSON.parse(msg);
    socket.leave(msg.roomNo);
    if (Ack) {
      Ack({status: 0});
    }
  }
}