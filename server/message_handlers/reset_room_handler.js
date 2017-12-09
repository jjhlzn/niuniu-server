"use strict";

const connectRedis = require('../db/redis_connect').connect;
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const gameState = require('../game_state');
const deck = require('../deck');
const _ = require('underscore');
const createFailHandler = require('./share_functions').createFailHandler;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const makeServerUrl = require('../db/game_server').makeServerUrl;
const gameDao = require('../db/game_dao');
const userDao = require('../db/user_dao');

let resetRoomHandler = (socket) => {
  return (msg, Ack) => {
    logger.debug("Receive ResetRoom: " + JSON.stringify(msg));

    let redisClient = connectRedis();

    let setUserLeaveGame = (game) => {
      return gameDao.getSitPlayerIds(game.roomNo)
              .then( userIds => {
                let allPromises = userIds.map(playerId => userDao.setUserLeaveGame(playerId, game));
                return Promise.all(allPromises).then( hashs => {
                  return game;
                });
              });
    }

    let resetGame = (game) => {
      game.state = gameState.BeforeStart;
      game.serverUrl = makeServerUrl();
      game.creater = "7654321";
      game.currentRoundNo = 1;
      game.totalRoundCount = 100;
      game.players = [];
      game.sitdownPlayers = {};
      game.rounds = [];
      game.scores = {};

      return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game))
        .then(res => {
          return Promise.resolve(game);
        });
    }

    let resetSitdownPlayers = (game) => {
      return redisClient.delAsync(gameUtils.sitdownPlayersKey(msg.roomNo)).then(
        res => {
          return Promise.resolve(game);
        }
      )
    }

    let resetRobBankers = (game) => {
      return redisClient.delAsync(gameUtils.robBankersKey(msg.roomNo)).then(
        res => {
          return Promise.resolve(game);
        }
      )
    }

    let resetBetPlayers = (game) => {
      return redisClient.delAsync(gameUtils.betPlayersKey(msg.roomNo)).then(
        res => {
          return Promise.resolve(game);
        }
      )
    }

    let resetShowCardPlayers = (game) => {
      return redisClient.delAsync(gameUtils.showcardPlayersKey(msg.roomNo)).then(
        res => {
          return Promise.resolve(game);
        }
      )
    }

    let resetReadyPlayers = (game) => {
      return redisClient.delAsync(gameUtils.readyPlayersKey(msg.roomNo)).then(
        res => {
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

    gameDao.getGame(msg.roomNo)
      .then(setUserLeaveGame)
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

module.exports = {
  resetRoomHandler: resetRoomHandler
}