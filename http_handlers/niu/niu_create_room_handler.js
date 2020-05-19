"use strict";
const gameState = require('../../game_state');
const connectRedis = require('../../db/redis_connect').connect;
const gameUtils = require('../../db/game_utils');
const _ = require('underscore');
var path = require('path');
const logger = require('../../utils/logger').logger(path.basename(__filename));
const makeServerUrl = require('../../db/game_server').makeServerUrl;
const userDao = require('../../db/user_dao');
const gameDao = require('../../db/game_dao');

exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("reqJson: " + JSON.stringify(json));
  let userId = json.userId;

  let checkUserIfInGame = () => {
    let game = {roomNo: ''};
    return userDao.getUser(userId)
      .then(user => {
        if (user.currentRoomNo) {
          return gameDao.getGame(user.currentRoomNo, true)
            .then( res => {
              if (!res) {
                return game;
              } else {
                return res;
              } 
            })
        } else {
          return game;
        }
      })
  }

  let setGameServer = (game) => {
    game.serverUrl =  makeServerUrl(game);
    return game;
  }

  let sendResponse = (game) => {
    let resp = _.extend({status: 0}, {roomNo: game.roomNo, serverUrl: game.serverUrl})
    return res.end(JSON.stringify(resp));
  }

  let failHandler = (error) => {
    logger.error("ERROR: " +  error);
    return res.end(JSON.stringify({status: -1, errorMessage: '创建房间失败'}));
  }

  let createNewGameIfNeed = (existGame) =>{
    logger.debug("existGame: " + JSON.stringify(existGame));
    if (existGame.roomNo)
      return existGame;

    let game = {};
    game.creater = userId;
    game.totalRoundCount = parseInt(json.jushu);
    //game.totalRoundCount = 1;
    game.robBankerType = json.qz;
    game.fengshu = json.fengshu;
    game.wanfa = json.wanfa;
    game.fangfei = json.fangfei;
    game.createTime = Date.now;
    game.state = gameState.BeforeStart;
    game.currentRoundNo = 1;
    game.players = [];
    game.sitdownPlayers = {};
    game.rounds = [];
    game.scores = {};

    return Promise.resolve(game)
      .then(setGameServer)
      .then(generateRoomNo)
      .then(saveGame)
      .then(makeCreaterSitdown)
  }

  checkUserIfInGame()
    .then(createNewGameIfNeed)
    .then(sendResponse)
    .catch(failHandler);
}

function getRandomRoomNo() {
  let str = "";
  for(var i = 0; i < 6; i++) {
    str += Math.floor( Math.random() * 10000000  % 10 );
  }
  return str;
}

function generateRoomNo(game) {
  game.roomNo = getRandomRoomNo();
  logger.debug("roomNo = " + game.roomNo);
  return connectRedis().existsAsync(gameUtils.gameKey(game.roomNo))
    .then( exists => {
      if (exists) {
        return generateRoomNo(game);
      }
      return game;
    })
}

function makeCreaterSitdown(game) {
  logger.debug("makeCreaterSitdown called")
  return connectRedis().hsetAsync(gameUtils.sitdownPlayersKey(game.roomNo), game.creater, 'A').then(res => {
    if (!res) {
      return Promise.reject(res);
    } 
    return userDao.setUserInGame(game.creater, game);
  });
}

function saveGame(game) {
  return connectRedis().setAsync(gameUtils.gameKey(game.roomNo), JSON.stringify(game))
    .then( res => {
      if (!res) {
        return Promise.reject("保存game失败")
      }
      return game;
    });
}