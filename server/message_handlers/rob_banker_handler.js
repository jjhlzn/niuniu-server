"use strict";

const connectRedis = require('../db/redis_connect').connect;
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const gameState = require('../game_state');
const deck = require('../deck');
const _ = require('underscore');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
const betHanlder= require('./bet_handler').betHandler;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

let locked = {};

function checkMessage(msg) {
  return null;
}

function chooseBanker(game, robBankerHash) {
  let playerIds = _.keys(robBankerHash);
  let robBankerIds = [];
  playerIds.forEach(playerId => {
    if (robBankerHash[playerId] == 1) {
      logger.debug("robBankerHash[playerId] = " + robBankerHash[playerId]);
      logger.debug(playerId + " rob banker");
      robBankerIds.push(playerId);
    }
  });

  let banker = "";
  if (robBankerIds.length >= 2) {
    let chooseIndex = Math.round(Math.random(0, 1) * 10000) % robBankerIds.length;
    banker = robBankerIds[chooseIndex];
  } else if (robBankerIds.length == 0) {
    let chooseIndex = Math.round(Math.random(0, 1) * 10000) % playerIds.length;
    banker = playerIds[chooseIndex];
  } else if (robBankerIds.length == 1) {
    banker = robBankerIds[0]
  }

  logger.debug("robBankerPalyers: " + robBankerIds);
  logger.debug(banker + " become to banker");
  
  return {
    banker: banker,
    robBankerPlayers: robBankerIds
  }
}

/**
 * 抢庄处理
 * 接受客户端的抢庄或不抢庄申请，给房间中的其他客户端发送这个请求。
 * 检查是否所有的客户端都已经抢庄，如果是，计算出一个抢庄结果，给客户端发送这个抢庄结果。
 * 并且进去下个状态。
 */
exports.robBankerHandler = (socket, io, handlers) => {

  return (msg, Ack) => {
    logger.debug("Receive RobBanker: " + JSON.stringify(msg));
    let redisClient = connectRedis();

    if (checkMessage() != null) {
      Ack({status: -1, errorMessage: '参数错误'});
      return;
    }

    let checkGameState = game => {
      if (game.state != gameState.RobBanker) {
        return Promise.reject("当前状态不允许抢庄: state = " + game.state);
      }
      return Promise.resolve(game);
    }
  
    let setRobBankerOrNot = (game) => {
      return redisClient.hexistsAsync(gameUtils.robBankersKey(msg.roomNo), msg.userId)
        .then( res => {
          if (res ) {
            return Promise.reject("改用户已经抢过庄, userId = " + msg.userId);
          }

          return redisClient.hsetAsync(gameUtils.robBankersKey(msg.roomNo), msg.userId, msg.isRob).then(res => {
            if (!res) {
              return Promise.reject("Redis Error, res = " + res);
            } 

            if (Ack) 
              Ack({status: 0});
            return Promise.resolve(game);
          });
        })
    }

    let sendSomePlayerRobBankerNotify = (game) => {
      
      io.to(msg.roomNo).emit(messages.SomePlayerRobBanker, msg);
      logger.debug("Sent SomePlayerRobBanker");
      return Promise.resolve(game);
    }

    
    let checkIsNeedGoToChooseBanker = (game) => {
      let round = game.rounds[game.rounds.length - 1];
      let playerIds = _.keys(round['players']);
      return redisClient.hgetallAsync(gameUtils.robBankersKey(msg.roomNo)).then(
        robBankerHash => {
          if (!robBankerHash) {
            return Promise.reject("get robBankerHash error, robBankerHash = " + robBankerHash);
          }

          let isNeedSend = true;
          playerIds.forEach( playerId => {
            if(!robBankerHash.hasOwnProperty(playerId)) {
              isNeedSend = false;
              logger.debug(playerId + " has not rob banker");
            }
          });

          return Promise.resolve({isNeedSend: isNeedSend, robBankerHash: robBankerHash, game: game});
        }
      )
    }

    //小心这里可能有并发问题，当抢庄超时发生的时候，几乎同时会进行默认抢庄的请求。这时只能进行一次选择庄家
    //以及发送一次跳转到下一个状态的通知。
    let sendGoToChooseBankerNotify = (checkResult) => {
      if (!checkResult.isNeedSend) {
        return Promise.resolve({isNeedSet: false, game: checkResult.game});
      }

      return getGame(msg.roomNo).then(
        game => {
          logger.debug("game.state = " + game.state);
          if (game.state == gameState.RobBanker && !locked[msg.roomNo]) {
            locked[msg.roomNo] = 1;
            let chooseResult = chooseBanker(game, checkResult.robBankerHash);
            //修改游戏的状态 和 庄家
            game.state = gameState.Bet;
            game.rounds[game.rounds.length - 1].banker = chooseResult.banker;
            logger.debug("game.rounds[game.rounds.length - 1].banker = " + game.rounds[game.rounds.length - 1].banker);
            return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game))
              .then( res => {
                delete locked[msg.roomNo];
                if (!res) {
                  return Promise.reject("update game error, res = " + res);
                }
      
                //发送
                io.to(msg.roomNo).emit(messages.GoToChooseBanker, {
                  banker: chooseResult.banker,
                  robBankerPlayers: chooseResult.robBankerPlayers
                });

                return Promise.resolve({isNeedSet: true, game: game});
              })
          } else {
            return Promise.resolve({isNeedSet: false, game: game});
          }
        }
      )
    }

    getGame(msg.roomNo)
      .then(checkGameState)
      .then(setRobBankerOrNot)
      .then(sendSomePlayerRobBankerNotify)
      .then(checkIsNeedGoToChooseBanker)
      .then(sendGoToChooseBankerNotify)
      .then(handlers.createBetTimer(socket, io, handlers))
      .catch(createFailHandler(Ack));
  }

}

exports.createRobBankerTimer = (socket, io, handlers) => {
  return (checkResult) => {
    //设置定时器，如果玩家不采取行动，会默认不抢庄
    if (checkResult.isNeedSet) {
      setTimeout(() => {
        logger.debug("RobBanker timer active!!!");
        getGame(checkResult.game.roomNo)
          .then(game => {
            if (game.currentRoundNo != checkResult.game.currentRoundNo) {
              logger.debug("this timer is last round, ignored");
              return;
            }

            if (game.state != gameState.RobBanker) {
              logger.debug("current state is " + game.state + ", robBankerTimer is invalid");
              return;
            }

            let round = game.rounds[game.rounds.length - 1];
            connectRedis().hgetallAsync(gameUtils.robBankersKey(game.roomNo))
              .then( robBankerHash => {
                if (!robBankerHash) {
                  robBankerHash = {};
                }
                logger.debug("robBankerHash = " + JSON.stringify(robBankerHash));
                _.keys(round.players).forEach(player => {
                  if (!robBankerHash[player]) {
                    let defaultRobBankerReq = {
                      roomNo: game.roomNo,
                      isRob: false,
                      userId: player
                    };
                    logger.debug(player + " haven't rob banker");
                    handlers['robBankerHandler'](socket, io, handlers)(defaultRobBankerReq);
                  }
                });
            });
        });
      }, gameUtils.robBankerTimeout);
    }
  }
}