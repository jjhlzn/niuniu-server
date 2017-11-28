
"use strict";

const connectRedis = require('../db/redis_connect').connect;
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const _ = require('underscore');
const deck = require('../deck');
const getGame = require('./share_functions').getGame;
const shareFunctions = require('./share_functions');
const createFailHandler = require('./share_functions').createFailHandler;
const gameState = require('../game_state');
const currentRoundPalyerIds = require('../db/game_utils').currentRoundPlayerIds;
const currentRoundPlayerInfos = require('../db/game_utils').currentRoundPlayerInfos;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const robBankerHandler = require('./rob_banker_handler').robBankerHandler;


let locked = {};
 
let createNewRound = (game) => {
  logger.debug("Create New round");
  let round = {
    banker: '',
    players: {}
  };
  game.rounds.push(round);
  
  game.state = gameState.RobBanker; //服务器没有FirstDeal的状态
  deck.deal(game);
}

/**
 * 接受客户端的准备请求。然后，将这个玩家的准备信息推送到房间内的其他客户端。
 * 检查，是否所有的玩家都已经准备，如果准备好，
 */
exports.readyHandler = (socket, io, handlers) => {
  return (msg, Ack) => {
    logger.debug("Receive Ready: " + JSON.stringify(msg));

    let redisClient = connectRedis();

    let setReady = (game) => {
      if (game.state != gameState.WaitForNextRound) {
        return Promise.reject("改状态不处理准备请求, state = " + game.state);
      }

      return redisClient.hsetAsync(gameUtils.readyPlayersKey(msg.roomNo), msg.userId, true)
        .then( res => {
          if (!res) {
            return Promise.reject("设置Ready失败, userId = " + msg.userId);
          }

          if (Ack) {
            Ack({status: 0});
          }
          return Promise.resolve(game);
        });
    }

    let sendSomePlayerReadyNotify = (game) => {
      io.to(msg.roomNo).emit(messages.SomePlayerReady, msg);
      return Promise.resolve(game);
    }

    let checkIsNeedSendGoToFirstDealNotify = (game) => {
      return redisClient.hgetallAsync(gameUtils.readyPlayersKey(msg.roomNo))
        .then( readyPlayerHash => {
          if ( !readyPlayerHash ) {
            return Promise.reject("获取readyPlayerHash失败");
          }

          return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(msg.roomNo))  
            .then( sitdownPlayerHash => {
              let playerIds = _.keys(sitdownPlayerHash);
              let isNeedSend = true;
              playerIds.forEach( playerId => {
                if (!readyPlayerHash[playerId]) {
                  logger.debug(playerId + "isn't ready");
                  isNeedSend = false;
                }
              });
              logger.debug("isNeedSend = " + isNeedSend);
              logger.debug("sitdownPlayerHash: " + JSON.stringify(sitdownPlayerHash));
              game.sitdownPlayers = sitdownPlayerHash;
              return Promise.resolve({isNeedSend: isNeedSend, game: game});
            });
        });
    }

    let resetRobBankers = (checkResult) => {
      if (!checkResult.isNeedSend) {
        return Promise.resolve(checkResult);
      }

      return redisClient.delAsync(gameUtils.robBankersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //logger.error("reset robBankers fail");
          }  else {
            logger.debug("reset robBankers success");
          }
          return Promise.resolve(checkResult);
        }
      )
    }

    let resetBetPlayers = (checkResult) => {
      if (!checkResult.isNeedSend) {
        return Promise.resolve(checkResult);
      }

      return redisClient.delAsync(gameUtils.betPlayersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //logger.error("reset batPlayers fail");
          } else {
            logger.debug("reset batPlayers success");
          }
          return Promise.resolve(checkResult);
        }
      )
    }

    let resetShowCardPlayers = (checkResult) => {
      return redisClient.delAsync(gameUtils.showcardPlayersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //logger.error("reset showcardPlayers fail");
          } else {
            logger.debug("reset showcardPlayers success");
          }
          return Promise.resolve(checkResult);
        }
      )
    }

    let resetReadyPlayers = (checkResult) => {
      if (!checkResult.isNeedSend) {
        return Promise.resolve(checkResult);
      }

      return redisClient.delAsync(gameUtils.readyPlayersKey(msg.roomNo)).then(
        res => {
          if (!res) {
            //logger.error("reset readyPlayers fail");
          } else {
            logger.debug("reset readyPlayers success");
          }
          
          return Promise.resolve(checkResult);
        }
      )
    }

    let getSitdownPlayers = (roomNo) => {
      return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(roomNo))
        .then( hash => {
          return hash;
        })
    }

    let sendGoToFirstDealNotify = (checkResult) => {
      
      if (checkResult.isNeedSend) {
        return Promise.all([getGame(msg.roomNo), getSitdownPlayers(msg.roomNo)])
          .then( hashs => {
            let game = hashs[0];
            let sitdownPlayers = hashs[1];
            game.sitdownPlayers = sitdownPlayers;
            if (!locked[msg.roomNo]) {
              locked[msg.roomNo] = true;

              createNewRound(game);
              return redisClient.setAsync(gameUtils.gameKey(msg.roomNo), JSON.stringify(game))
                .then( res => {
                  delete locked[msg.roomNo];
                  if (!res) {
                    return Promise.reject("保存Game失败");
                  }

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
                    roundNo: game.currentRoundNo
                  }) 
                  logger.debug('Sent GoToFirstDeal');
                  
                  return Promise.resolve({isNeedSet: true, game: game});
                })
            }  else {
              return Promise.resolve({isNeedSet: false, game: game});
            }

          })
      } else {
        return Promise.resolve({isNeedSet: false, game: checkResult.game});
      }
    }



    getGame(msg.roomNo)
      .then(setReady)
      .then(sendSomePlayerReadyNotify)
      .then(checkIsNeedSendGoToFirstDealNotify)
      .then(resetRobBankers)
      .then(resetBetPlayers)
      .then(resetShowCardPlayers)
      .then(resetReadyPlayers)
      .then(sendGoToFirstDealNotify)
      .then(handlers.createRobBankerTimer(socket,io, handlers))
      .catch(createFailHandler(Ack));
  }
}

exports.createReadyTimer = (socket, io, handlers) => {
  return (checkResult) => {
    if (checkResult.isNeedSet) {
      setTimeout( () => {
        logger.debug("Ready timer active!!!!");
        getGame(checkResult.game.roomNo)
          .then( game => {
            connectRedis().hgetallAsync(gameUtils.readyPlayersKey(game.roomNo))
              .then( readyPlayerHash => {
                  if (!readyPlayerHash) {
                    readyPlayerHash = {};
                  }
    
                  connectRedis().hgetallAsync(gameUtils.sitdownPlayersKey(game.roomNo))
                    .then( sitdownPlayerHash => {
                      let playerIds = _.keys(sitdownPlayerHash);
                      logger.debug("playerIds = " + playerIds);
                      playerIds.forEach( playerId => {
                        if (!readyPlayerHash[playerId]) {
                          //发送超时的准备
                          let readyReq = {
                            userId: playerId,
                            roomNo: game.roomNo
                          };
                          handlers['readyHandler'](socket, io, handlers)(readyReq);
                        }
                      });
                    });
              });
          })
      }, gameUtils.readyTimeout);
    }
  }
}