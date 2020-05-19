"use strict";

var path = require('path');
const logger = require('../../utils/logger').logger(path.basename(__filename));
const gameState = require('../../game_state');
const gameUtils = require('../../db/game_utils');
const getGame = require('./share_functions').getGame;
const messages = require('../messages');
const createFailHandler = require('./share_functions').createFailHandler;
const connectRedis = require('../../db/redis_connect').connect;
const userDao = require('../../db/user_dao');
const gameDao = require('../../db/game_dao');
const _ = require('underscore');

//只有房主能够解散房间
exports.dismissRoomHanler = (socket, io) => {
  //1. 首先检查是否是房主发出的请求
  //2, 检查游戏的状态，只有未开始的能够解散
  //3. 如果都满足，解散房间。

   return (msg, Ack) => {
    msg = JSON.parse(msg);
    gameUtils.logNewRequest("Dismiss Room", msg)

    let redisClient = connectRedis();
    let checkCreater = (game) => {
      if (game.creater != msg.userId) {
        logger.debug("roomNo: " + game.roomNo + ", creater: " + game.creater);
        Promise.reject("你不是房主，不能解散房间");
        return;
      }
      return game;
    };

    let checkState = (game) => {
      if (game.state != gameState.BeforeStart) {
        logger.debug("roomNo: " + game.roomNo + ", state: " + game.state);
        Promise.reject("当前游戏状态不能解散");
        return;
      }
      return game;
    }

    let setAllUsersLeaveGame = (game) => {
      
      return gameDao.getSitPlayerIds(game.roomNo)
        .then( userIds => {
          let allPromises = userIds.map(userId => userDao.setUserLeaveGame(userId, game));
          return Promise.all(allPromises).then( hashs => {
            return game;
          });
        });
    }

    let dismissRoom = (game) => {
      io.to(game.roomNo).emit(messages.RoomHasDismissed, {roomNo: game.roomNo})
      if (game.roomNo == "123456") {
        Ack({status: 0});
      } else {
        return redisClient.delAsync(gameUtils.gameKey(game.roomNo))
          .then(res => {
            if (Ack) {
              Ack({status: 0});
            }
          })
      }
      return game;
    }

    getGame(msg.roomNo)
      .then(checkCreater)
      .then(checkState)
      .then(setAllUsersLeaveGame)
      .then(dismissRoom)
      .catch(createFailHandler(Ack));
   }
}