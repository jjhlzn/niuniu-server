"use strict";

const connectRedis = require('../../db/redis_connect').connect;

const gameUtils = require('../../db/game_utils');
const messages = require('../messages');
const _ = require('underscore');
const createFailHandler = require('./share_functions').createFailHandler;
const getGame = require('./share_functions').getGame;
const gameState = require('../../game_state');
const currentRoundPalyerIds = require('../../db/game_utils').currentRoundPlayerIds;
const currentRoundPlayerInfos = require('../../db/game_utils').currentRoundPlayerInfos;
const gameDao = require('../../db/game_dao');
const userDao = require('../../db/user_dao');
const hasNextRound = require('../../db/game_utils').hasNextRound;
const moment = require('moment');
var path = require('path');
const logger = require('../../utils/logger').logger(path.basename(__filename));
const lock = require('../../utils/lock').createLock();


/**
 * 亮牌处理器。接受客户端的亮牌，如果所有的玩家都亮牌了，
 * 则跳转到下一个游戏状态。
 */
let showcardHandler = (socket, io, handlers) => {

  return (msg, Ack) => {
    msg = JSON.parse(msg);
    gameUtils.logNewRequest("Show Card", msg)

    let redisClient = connectRedis();

    let setShowCard = (game) => {
      if (game.state != gameState.CheckCard) {
        return Promise.reject("当前状态为" + game.state + ", 不能showcard");
      }
      return redisClient.hsetAsync(gameUtils.showcardPlayersKey(msg.roomNo), msg.userId, true)
              .then(res => {
                if (!res) {
                  return Promise.reject("setShowCard失败: userid = " + msg.userId);
                }

                return game;
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
            logger.debug("game.state = " + game.state);
            if (game.state == gameState.CheckCard && lock.get(game.roomNo) ) {
              //logger.debug("sendGoToCompareCardNotify: get lock for room: " + msg.roomNo);
              //game.state = gameState.CheckCard;
            
              let playerIds = currentRoundPalyerIds(game);
              let playerInfos = currentRoundPlayerInfos(game);
      
              //计算输赢
              gameUtils.computeWinOrLoss(game);

              let resultDict = {};
              
              playerIds.forEach(playerId => {
                resultDict[playerId] = playerInfos[playerId].winOrLoss;
              }); 
      
              //保存游戏的状态
              let isNeedSetTimer = false;
              let isGameOver = false;
              if (hasNextRound(game)) {
                game.state = gameState.WaitForNextRound;
                game.currentRoundNo++;
                isNeedSetTimer = true;
              } else {
                game.state = gameState.GameOver;
                game.gameOverTime = moment().format('YYYY-MM-DD HH:mm:ss')
                isNeedSetTimer = false;
                isGameOver = true;
              }
              
              logger.debug("resultDict: " + JSON.stringify(resultDict));
              logger.debug("scores: " + JSON.stringify(game.scores));
              return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game))
                .then( res => {
                  //delete locked[msg.roomNo];
                  //logger.debug("sendGoToCompareCardNotify: release lock for room: " + msg.roomNo);
                  if (!res) {
                    return Promise.reject("保存Game时出错, res = " + res);
                  }
                  
                  if (isGameOver) {
                    gameDao.getSitPlayerIds(game.roomNo)
                            .then( userIds => {
                              let allPromises = userIds.map(userId => userDao.setUserLeaveGame(userId, game));
                              return Promise.all(allPromises).then( hashs => {
                                logger.debug("所有的人的currentRoomNo都设置为空了")
                                return game;
                              });
                            })
                            .catch( (error) => {
                              logger.error("游戏结束时，设置currentRoomNo的时候出错, error = " + error);
                            });;
                    
                    //将游戏保存到MongoDB, 并且从Redis中删除
                    return gameDao.saveGameRecord(game).then( () => {
                      let resp = makeGameOverResponse(game);
                      io.to(msg.roomNo).emit(messages.GoToGameOver, _.extend(resp, {resultDict: resultDict, gameOverAfterRound: true}));
                      logger.debug("Sent GameOver Notify");
                      return {isNeedSet:isNeedSetTimer, game: game};
                    })
                  } else {
                    io.to(msg.roomNo).emit(messages.GoToCompareCard, {
                      resultDict: resultDict,
                      scoreDict: game.scores
                    });
                    logger.debug("Sent GoToCompareCard");
                  }
                  return {isNeedSet:isNeedSetTimer, game: game};
            })
          } else {
            return {isNeedSet: false, game: game};
          }
        });
      } else {
        return {isNeedSet: false, game: checkResult.game};
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

let createShowcardTimer = (socket, io, handlers) => {
  return (checkResult) => {
    if (checkResult.isSetTimer) {
      setTimeout( ()=> {
        getGame(checkResult.game.roomNo)
          .then(game => {
            logger.debug("showcard timer active!!!");
            if (game.currentRoundNo != checkResult.game.currentRoundNo) {
              logger.debug("this timer is last round, ignored");
              return;
            }

            if (game.state != gameState.CheckCard) {
              logger.debug("current state is " + game.state + ", ShowCardTimer is invalid");
              return;
            }
      
            connectRedis().hgetallAsync(gameUtils.showcardPlayersKey(game.roomNo))
              .then( betPlayerHash => {
                if (!betPlayerHash) {
                  betPlayerHash = {};
                }
                let playerIds = currentRoundPalyerIds(checkResult.game);
    
                playerIds.forEach( playerId => {
                  if (!betPlayerHash[playerId]) {
                    logger.debug(playerId + " hasn't showcard");
                    handlers['showcardHandler'](socket, io, handlers)(JSON.stringify({
                      roomNo: game.roomNo,
                      userId: playerId
                    }))
                  }
                });
              } )
          });
      }, gameUtils.showCardTimeout);
    }
  }
}

let  getBiggerWinnersAndLosers = (scores) => {
  let keys = _.keys(scores);
  let values = _.values(scores);
  if (values.length <= 1) {
    logger.error("ERROR: values.length = " + values.length);
    return {biggestWinners: [], biggestLosers: []};
  }

  let sortedScores = _.zip(keys, values).sort( (a, b) => a[1] - b[1]);
  logger.debug("sortedScores: " + sortedScores);
  keys = sortedScores.map( a => a[0]);
  values = sortedScores.map( a => a[1]);
 
  let biggest = values[sortedScores.length - 1];
  let smallest = values[0];
  logger.debug("biggest = " + biggest + ", smallest = " + smallest);

  let biggestWinners = [];
  //logger.debug("_.zip(keys, values): " + JSON.stringify(_.zip(keys, values)));
  if (biggest > 0) {
     biggestWinners = sortedScores.filter(a => a[1] == biggest).map(a => a[0]);
  }
  logger.debug("biggestWinners = " + biggestWinners + ", biggest = " + biggest);
  let biggestLosers = [];
  if (smallest < 0) {
    biggestLosers =  sortedScores.filter(a => a[1] == smallest).map(a => a[0]);
  }
  logger.debug("biggestLosers = " + biggestLosers + ", smallest = " + smallest);
  return {biggestWinners: biggestWinners, biggestLosers: biggestLosers};
}

function makeGameOverResponse(game) {
  //scores
  let response = {};
  response.scores = game.scores;
  let result = getBiggerWinnersAndLosers(response.scores);
  response.bigWinners = result.biggestWinners;
  response.bigLosers = result.biggestLosers;
  response.isPlayed = game.isPlayed ? true : false;
  response.gameOverTime = game.gameOverTime;
  return response;
}

module.exports = {
  showcardHandler: showcardHandler,
  createShowcardTimer: createShowcardTimer,
  getBiggerWinnersAndLosers: getBiggerWinnersAndLosers
}