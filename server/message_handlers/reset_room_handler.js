"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const gameState = require('../game_state');
const deck = require('../deck');
const _ = require('underscore');
const createFailHandler = require('./share_functions').createFailHandler;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const makeServerUrl = require('../db/game_server').makeServerUrl;

function checkMessage(msg) {
  return null;
}

exports.resetRoomHandler = (socket) => {
  return (msg, Ack) => {
    logger.debug("Receive ResetRoom: " + JSON.stringify(msg));

    if (checkMessage() != null) {
      Ack({status: -1, errorMessage: '参数错误'});
      return;
    }

    let getGame = (roomNo) => {
      return redisClient.getAsync(gameUtils.gameKey(msg.roomNo))
        .then( res => {
          if (!res) {
            return Promise.reject("服务器出错");
          }
    
          return Promise.resolve(JSON.parse(res));
        });
    };

    let resetGame = (game) => {
      game.state = gameState.BeforeStart;
      game.serverUrl = makeServerUrl();
      game.creater = "7654321";
      game.currentRoundNo = 1;
      game.totalRoundCount = 1000;
      game.players = [];
      game.sitdownPlayers = {};
      game.rounds = [];
      game.scores = {};

      return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game))
        .then(res => {
          if (!res) {
            //return Promise.reject("保存到redis失败");
          }
          return Promise.resolve(game);
        });
    }

    let resetSitdownPlayers = (game) => {
      return redisClient.delAsync(gameUtils.sitdownPlayersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //return Promise.reject("reset sitdown players失败");
          }
          return Promise.resolve(game);
        }
      )
    }

    let resetRobBankers = (game) => {
      return redisClient.delAsync(gameUtils.robBankersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //return Promise.reject("reset robBankers fail");
          }
          return Promise.resolve(game);
        }
      )
    }

    let resetBetPlayers = (game) => {
      return redisClient.delAsync(gameUtils.betPlayersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            return Promise.reject("reset batPlayers fail");
          }
          return Promise.resolve(game);
        }
      )
    }

    let resetShowCardPlayers = (game) => {
      return redisClient.delAsync(gameUtils.showcardPlayersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //return Promise.reject("reset showcardPlayers fail");
          }
          return Promise.resolve(game);
        }
      )
    }

    let resetReadyPlayers = (game) => {
      return redisClient.delAsync(gameUtils.readyPlayersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //return Promise.reject("reset readyPlayers fail");
          }
          return Promise.resolve(game);
        }
      )
    }

    let done = () => {
      logger.debug("reset success");
    }

    let failHandler = (error) => {
      if (error) {
        console.log("ERROR: " + error);
        return;
      }
      Ack({status: -1, errorMessage: error});
    }

    getGame(msg.roomNo)
      .then(resetGame)
      .then(resetSitdownPlayers)
      .then(resetRobBankers)
      .then(resetBetPlayers)
      .then(resetShowCardPlayers)
      .then(resetReadyPlayers)
      .then(done)
      .catch(createFailHandler(Ack));

  };
};