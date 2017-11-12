"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const _ = require('underscore');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

function checkMessage(msg) {
  return null;
}

exports.sitdownHandler = (socket) => {
  return (msg, Ack) => {
    logger.debug("Receive SitDown: " + JSON.stringify(msg));

    //TODO：验证参数的有效性
    if (checkMessage() != null) {
      Ack({status: -1, errorMessage: '参数错误'});
      return;
    }
    
    let checkSeat = (game) => {
      redisClient.existsAsync(gameUtils.sitdownPlayersKey(msg.roomNo))
        .then( exists => {
          if (!exists) {
            return Promise.resolve(true);
          } else {
            return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(msg.roomNo)).then(playerHash => {
              if (!playerHash) {
                return Promise.reject("获取sitdownPlayers失败");
              }

              logger.debug("sitdownPlayes: " +JSON.stringify(playerHash));
              if (playerHash[msg.userId]) {
                return Promise.reject('Player ' + msg.seat + ' has sit down');
              }
      
              let seatNos = _.values(playerHash);
              if (seatNos.filter( seatNo => {return seatNo == msg.seatNo}).length > 0) {
                return Promise.reject('Seat ' + msg.seat + ' has player: ' +playerHash[msg.seat]);
              }

              return Promise.resolve(true);
            });
          }
        });
    }

    let sit = () => {
      redisClient.hsetAsync(gameUtils.sitdownPlayersKey(msg.roomNo), msg.userId, msg.seat).then(res => {
        if (!res) {
          return Promise.reject(res);
        } 
        return Promise.resolve(true);
      });
    }

    //TODO：检查自己是否已经在该座位上
    let checkSit = () => {
      Ack({status: 0});
      socket.to(msg.roomNo).emit(messages.SomePlayerSitDown, msg);
    }

 
    getGame(msg.roomNo)
      .then(checkSeat)
      .then(sit)
      .then(checkSit)
      .catch(createFailHandler(Ack));
  }
}