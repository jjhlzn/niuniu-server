"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const getGame = require('./share_functions').getGame;
const shareFunctions = require('./share_functions');
const createFailHandler = require('./share_functions').createFailHandler;
const gameState = require('../game_state');
const messages = require('../messages');
const deck = require('../deck');
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));


function checkMessage(msg) {
  return null;
}

/**
 * 游戏开始，挑战游戏状态到FirstDeal, 给所有人员发牌，能进行的下注。
 * 创建Round对象。
 */
exports.startGameHandler = (socket, io, handlers) => {
  return (msg, Ack) => {
    logger.debug("Receive StartGame: " + JSON.stringify(msg));

    if (checkMessage() != null) {
      Ack({status: -1, errorMessage: '参数错误'});
      return;
    }

    let setSitDownPlayers = (game) => {
      return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(msg.roomNo)).then(playerHash => {
        if (!playerHash) {
          return Promise.reject("playerHash is null");
        }
        game.sitdownPlayers = playerHash;
        return Promise.resolve(game);
      });
    };

    let createNewRound = (game) => {
      let round = {
        banker: '',
        players: {}
      };
      game.rounds.push(round);
      game.state = gameState.RobBanker; //服务器没有FirstDeal的状态
      game.isPlayed = true;
      deck.deal(game);
      //保存游戏的状态
      return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game)).then( res => {
        if (!res) {
          return Promise.reject("保存New Round失败");
        }
        return Promise.resolve(game);
      });
    }

    
    let sendStartGameNotify = (game) => {
      Ack({status: 0});
      let round = game.rounds[game.rounds.length - 1];
      let cardsDict = {};
      let betsDict = {};
      _.keys(round.players).forEach(player => {
        cardsDict[player] = round['players'][player].cards;
        betsDict[player] = round['players'][player].bets;
      });
      io.to(msg.roomNo).emit(messages.GoToFirstDeal, {
        cardsDict: cardsDict,
        betsDict: betsDict,
        roundNo: 1
      })
      logger.debug('Sent GoToFirstDeal');
      return Promise.resolve({isNeedSet: true, game: game});
    }; 

    

    getGame(msg.roomNo)
      .then(setSitDownPlayers)
      .then(createNewRound)
      .then(sendStartGameNotify)
      .then(handlers.createRobBankerTimer(socket, io, handlers))
      .catch(createFailHandler(Ack));
    
  }
}