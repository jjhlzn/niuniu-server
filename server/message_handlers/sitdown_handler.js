"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const _ = require('underscore');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));


exports.sitdownHandler = (socket) => {
  return (msg, Ack) => {
    logger.debug("Receive SitDown: " + JSON.stringify(msg));
    
    let checkSeat = (game) => {
      return redisClient.existsAsync(gameUtils.sitdownPlayersKey(msg.roomNo))
        .then( exists => {
          if (!exists) {
            return true;
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

              return true;
            });
          }
        });
    }

    let sit = () => {
      return redisClient.hsetAsync(gameUtils.sitdownPlayersKey(msg.roomNo), msg.userId, msg.seat).then(res => {
        if (!res) {
          return Promise.reject(res);
        } 
        return true;
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