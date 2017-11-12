"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const _ = require('underscore');
const createFailHandler = require('./share_functions').createFailHandler;
const getGame = require('./share_functions').getGame;
const gameState = require('../game_state');
const currentRoundPalyerIds = require('../db/game_utils').currentRoundPlayerIds;
const currentRoundPlayerInfos = require('../db/game_utils').currentRoundPlayerInfos;
const hasNextRound = require('../db/game_utils').hasNextRound;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

function checkMessage(msg) {
  return null;
}

let locked = {};

/**
 * 亮牌处理器。接受客户端的亮牌，如果所有的玩家都亮牌了，
 * 则跳转到下一个游戏状态。
 */
exports.showcardHandler = (socket, io, handlers) => {

  return (msg, Ack) => {
    logger.debug("Receive ShowCard: " + JSON.stringify(msg));

    if (checkMessage() != null) {
      Ack({status: -1, errorMessage: '参数错误'});
      return;
    }

    let setShowCard = (game) => {
      return redisClient.hsetAsync(gameUtils.showcardPlayersKey(msg.roomNo), msg.userId, true)
              .then(res => {
                if (!res) {
                  return Promise.reject("setShowCard失败: userid = " + msg.userId);
                }

                return Promise.resolve(game);
              })
    };

    let sendSomePlayerShowCardNotify = (game) => {
      let playerIds = currentRoundPalyerIds(game);
      let playerInfos = currentRoundPlayerInfos(game);

      let notify = null;
      playerIds.forEach(playerId => {
        if (playerId == msg.userId) {
          //logger.debug("找到"+playerId + "的信息");
          notify = {
            userId: msg.userId,
            niu: playerInfos[playerId].niu,
            multiple: playerInfos[playerId].multiple,
            cardSequences: playerInfos[playerId].cardSequences,
            cards: playerInfos[playerId].cards
          }
        }
      })

      if (!notify) {
        return Promise.reject("服务器出错，找不到" + msg.userId + "信息");
      }

      if (Ack) {
        Ack(_.extend(notify, {status: 0, errorMessage: ""}));
      }
      io.to(msg.roomNo).emit(messages.SomePlayerShowCard, notify);
      return Promise.resolve(game);
    }

    let checkIsNeedSendGoToCompareCardNotify = (game) => {
      return redisClient.hgetallAsync(gameUtils.showcardPlayersKey(msg.roomNo))
              .then( showcardPlayerHash => {
                if (!showcardPlayerHash) {
                  return Promise.reject("获取showcardPlayerHash失败");
                }

                let isNeedSend = true;
                let playerIds = currentRoundPalyerIds(game);
                playerIds.forEach( playerId => {
                  if (!showcardPlayerHash[playerId]) {
                    isNeedSend = false;
                    logger.debug(playerId + " haven't show card");
                  }
                });

                return Promise.resolve({isNeedSend: isNeedSend, game: game});
              });
    }

    let sendGoToCompareCardNotify = (checkResult) => {
      if (checkResult.isNeedSend) {

          return getGame(msg.roomNo).then( game => {
            if (game.state == gameState.CheckCard && !locked[msg.roomNo]) {
              locked[msg.roomNo] = true;
              game.state = gameState.CheckCard;
            
              let playerIds = currentRoundPalyerIds(checkResult.game);
              let playerInfos = currentRoundPlayerInfos(checkResult.game);
      
              let resultDict = {};
              playerIds.forEach(playerId => {
                resultDict[playerId] = playerInfos[playerId].winOrLoss;
              })
      
              //保存游戏的状态
              let isNeedSetTimer = false;
              if (hasNextRound(game)) {
                game.state = gameState.WaitForNextRound;
                game.currentRoundNo++;
                isNeedSetTimer = true;
              } else {
                game.state = gameState.GameOver;
                isNeedSetTimer = false;
              }
              
              return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game))
                .then( res => {
                  delete locked[msg.roomNo];
                  if (!res) {
                    return Promise.reject("保存Game时出错, res = " + res);
                  } 
                  io.to(msg.roomNo).emit(messages.GoToCompareCard, {
                    resultDict: resultDict
                  });
                  logger.debug("Sent GoToCompareCard");
                  return Promise.resolve({isNeedSet:isNeedSetTimer, game: game});
            })
          } else {
            return Promise.resolve({isNeedSet: false, game: game});
          }
        });
      } else {
        return Promise.resolve({isNeedSet: false, game: checkResult.game});
      }
    };

    getGame(msg.roomNo)
      .then(setShowCard)
      .then(sendSomePlayerShowCardNotify)
      .then(checkIsNeedSendGoToCompareCardNotify)
      .then(sendGoToCompareCardNotify)
      .then(handlers.createReadyTimer(socket, io, handlers))
      .catch(createFailHandler(Ack));

  }
}

exports.createShowcardTimer = (socket, io, handlers) => {
  return (checkResult) => {
    if (checkResult.isSetTimer) {
      setTimeout( ()=> {
        getGame(checkResult.game.roomNo)
          .then(game => {
            logger.debug("showcard timer active!!!");
            redisClient.hgetallAsync(gameUtils.showcardPlayersKey(game.roomNo))
              .then( betPlayerHash => {
                if (!betPlayerHash) {
                  betPlayerHash = {};
                }
                let playerIds = currentRoundPalyerIds(checkResult.game);
    
                playerIds.forEach( playerId => {
                  if (!betPlayerHash[playerId]) {
                    logger.debug(playerId + " hasn't showcard");
                    handlers['showcardHandler'](socket, io, handlers)({
                      roomNo: game.roomNo,
                      userId: playerId
                    })
                  }
                });
              } )
          });
      }, gameUtils.showCardTimeout);
    }
  }
}