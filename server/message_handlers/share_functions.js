"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const deck = require('../deck');
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

let getGame = (roomNo) => {
  return redisClient.getAsync(gameUtils.gameKey(roomNo))
    .then( res => {
      if (!res) {
        return Promise.reject("获取房间出错[roomNo = " + roomNo +"]：res = " + res);
      }

      return Promise.resolve(JSON.parse(res));
    });
};

let createFailHandler = (Ack) => {
  return (error) => {
    logger.error("ERROR: " +error);
    
    if (Ack) 
      Ack({status: -1, errorMessage: error});
  }
}


module.exports = {
  getGame: getGame,
  createFailHandler: createFailHandler
}

