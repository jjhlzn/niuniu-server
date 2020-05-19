"use strict";

const gameState = require('../game_state');
const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const getGame = require('../niu/message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

function saveGame(game) {
  return redisClient.setAsync(gameUtils.gameKey(game.roomNo), JSON.stringify(game))
    .then( res => {
      if (!res) {
        return Promise.reject("保存game失败")
      }
      return game;
    });
}

exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("reqJson: " + JSON.stringify(json));

  //TODO 检查用户是否在游戏中
  let checkUser = () => {
    return game;
  }

  let sendResponse = (game) => {
    let resp = {};
    resp.serverUrl =  game.serverUrl; 
    resp.isExist = true;
    resp.roomNo = json.roomNo;
    res.end(JSON.stringify(resp));;
  }

  let failHandler = (error) => {
    logger.error("ERROR: " +  error);
    return res.end(JSON.stringify({status: -1, errorMessage: '该房间不存在'}));
  }

  getGame(json.roomNo)
    .then(sendResponse)
    .catch(failHandler);
  
}