"use strict";

const gameState = require('../game_state');
const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
/*
   reqJson = {
      userId:  ''
   }
*/
function getRandomRoomNo() {
  let part2 = Math.round( Math.random() * 10000000  % 100000 );
  let part1 = Math.round( Math.random() * 10000000  % 10 ) * 100000;
  if (part1 == 0) 
    part1 = 100000;
  return part1 + part2;
}

function generateRoomNo(game) {
  game.roomNo = getRandomRoomNo();
  return redisClient.existsAsync(gameUtils.gameKey(game.roomNo))
    .then( exists => {
      if (exists) {
        return generateRoomNo(game);
      }
      return game;
    })
}

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

  let game = {};
  game.creater = json.userId;
  game.createTime = Date.now;
  game.state = gameState.BeforeStart;
  game.currentRoundNo = 1;
  game.totalRoundCount = 10;
  game.players = [];
  game.sitdownPlayers = {};
  game.rounds = [];
  game.scores = {};

  //TODO 检查用户是否在游戏中
  let checkUser = () => {
    return game;
  }

  let setGameServer = (game) => {
    game.serverUrl =  "http://localhost:3000";// "http://192.168.31.175:3000";
    return game;
  }

  let sendResponse = (game) => {
    let resp = _.extend({status: 0}, game)
    return res.end(JSON.stringify(resp));
  }

  let failHandler = (error) => {
    logger.error("ERROR: " +  error);
    return res.end(JSON.stringify({status: -1, errorMessage: '创建房间失败'}));
  }

  Promise.resolve(game)
    .then(checkUser)
    .then(setGameServer)
    .then(generateRoomNo)
    .then(saveGame)
    .then(sendResponse)
    .catch(failHandler);
  
}