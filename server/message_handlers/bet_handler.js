"use strict";

const connectRedis = require('../db/redis_connect').connect;
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const gameState = require('../game_state');
const deck = require('../deck');
const _ = require('underscore');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
const currentRoundPalyerIds = require('../db/game_utils').currentRoundPlayerIds;
const currentRoundPlayerInfos = require('../db/game_utils').currentRoundPlayerInfos;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

function checkMessage(msg) {
  return null;
}

let locked = {};

/**
 * 下注处理器。接受客户端的下注，设置客户端的下注量，如果所有的闲家都下注了，
 * 则跳转到下一个游戏状态。
 */
exports.betHandler = (socket, io, handlers) => {
  return (msg, Ack) => {
    msg = JSON.parse(msg);
    logger.info("Receive bet: " + JSON.stringify(msg));

    let redisClient = connectRedis();
    if (checkMessage() != null) {
      Ack({status: -1, errorMessage: '参数错误'});
      return;
    }

    //TODO: 验证是否能够下注
    let checkBet = (game) => {
      return Promise.resolve(game);
    }

    let setPlayerBet = (game) => {
      

      return redisClient.hsetAsync(gameUtils.betPlayersKey(msg.roomNo), msg.userId, msg.bet)
        .then( res => {
          if (!res) {
            return Promise.reject("设置下注失败：userId = " + msg.userId);
          }
          io.to(msg.roomNo).emit(messages.SomePlayerBet, msg);
          return Promise.resolve(game);
        });
    }

    let checkIsNeedGoToSecondDeal = (game) => {
      return redisClient.hgetallAsync(gameUtils.betPlayersKey(msg.roomNo))
        .then( betPlayerHash => {
          if (!betPlayerHash) {
            return Promise.reject("获取BetPlayerHash失败");
          }
          logger.debug("betPlayerHash = " + JSON.stringify(betPlayerHash));
          let playerIds = _.keys(game.rounds[game.rounds.length - 1]['players']);
          let isNeedSend = true;
          playerIds.forEach( playerId => {

            if (!betPlayerHash[playerId] && playerId != game.rounds[game.rounds.length - 1].banker) {
              logger.debug(playerId + " haven't bet , banker is " + game.rounds[game.rounds.length - 1].banker);
              isNeedSend = false;
            }
          })

          logger.debug("isNeedToSendDealNotify = " + isNeedSend);
          return Promise.resolve({isNeedSend: isNeedSend, game: game, betPlayerHash: betPlayerHash});
        });
    }

    let sendGoToSecondDealNotify = (checkResult) => {
      if (checkResult.isNeedSend) {
        return getGame(msg.roomNo).then( game => {
          if (game.state == gameState.Bet && !locked[msg.roomNo]) {
            locked[msg.roomNo] = true;
            game.state = gameState.CheckCard;
            let round = game.rounds[game.rounds.length - 1];

            //设置bet
            _.keys(round.players).forEach( playerId => {
              round.players[playerId].bet = checkResult.betPlayerHash[playerId];
            })
            return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game))
              .then(res => {
                delete locked[msg.roomNo];
                if (!res) {
                  return Promise.reject("设置Game失败");
                }
                let playerInfos = game.rounds[game.rounds.length -1]['players'];
                let playerIds = _.keys(playerInfos);
                let cardsDict = {};
                playerIds.forEach( playerId => {
                  cardsDict[playerId] = playerInfos[playerId]['cards'][4];
                })
                io.to(msg.roomNo).emit(messages.GoToSecondDeal, {
                  cardsDict: cardsDict
                });
                logger.debug("Sent GoToSecondDeal");

                
                return Promise.resolve({isSetTimer: true, game: checkResult.game});
              })
          } else {
            return  Promise.resolve({isSetTimer: false, game: checkResult.game});
          }
        }); 
      } else {
        return  Promise.resolve({isSetTimer: false, game: checkResult.game});
      }
    }

    let done = () => {
      
      if (Ack)
        Ack({status: 0});
    }


    getGame(msg.roomNo)
      .then(checkBet)
      .then(setPlayerBet)
      .then(checkIsNeedGoToSecondDeal)
      .then(sendGoToSecondDealNotify)
      .then(handlers.createShowcardTimer(socket, io, handlers))
      .then(done)
      .catch(createFailHandler(Ack));

  }
}

//设置下注超时
exports.createBetTimer = (socket, io, handlers) => {
  return (checkResult) => {
    if (checkResult.isNeedSet) {
      logger.debug("setBetTimer called");
      setTimeout( ()=> {
        logger.debug("bet timer active!!!");
        getGame(checkResult.game.roomNo)
          .then( game => {
            if (game.currentRoundNo != checkResult.game.currentRoundNo) {
              logger.debug("this timer is last round, ignored");
              return;
            }

            if (game.state != gameState.Bet) {
              logger.debug("current state is " + game.state + ", BetTimer is invalid");
              return;
            }

            let playerIds = _.keys(game.rounds[game.rounds.length - 1]['players']);
            connectRedis().hgetallAsync(gameUtils.betPlayersKey(game.roomNo))
              .then( betPlayerHash => {
                if (!betPlayerHash) {
                  betPlayerHash = {};
                }
    
                playerIds.forEach( playerId => {
                  if (!betPlayerHash[playerId] && playerId != game.rounds[game.rounds.length - 1].banker) {
                    logger.debug(playerId + " haven't bet, banker = " + game.rounds[game.rounds.length - 1].banker)
                    let betReq = {
                      roomNo: game.roomNo,
                      userId: playerId,
                      bet: game.rounds[game.rounds.length - 1].players[playerId].bets[0]
                    }
                    handlers['betHandler'](socket, io, handlers)(JSON.stringify(betReq));
                  }
                });
            })
          });
      }, gameUtils.betTimeout);
    }
  }
}
