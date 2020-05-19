"use strict";

const gameState = require('../game_state');
const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const getGame = require('../niu/message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const populateGame = require('../niu/message_handlers/join_room_handler').populateGame;

exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("reqJson: " + JSON.stringify(json));

  let sendResponse = (game) => {
    res.end(JSON.stringify(_.extend({status: 0}, game)));
  }

  let failHandler = (error) => {
    logger.error("ERROR: " +  error);
    return res.end(JSON.stringify({status: -1, errorMessage: '该房间不存在'}));
  }

  getGame(json.roomNo)
    .then(populateGame)
    .then(sendResponse)
    .catch(failHandler);
  
}