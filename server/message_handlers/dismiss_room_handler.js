import { Promise } from '../../../../Library/Caches/typescript/2.6/node_modules/@types/bluebird';

"use strict";

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const gameState = require('../game_state');
const gameUtils = require('../db/game_utils');
const getGame = require('./share_functions').getGame;
const messages = require('../messages');
const createFailHandler = require('./share_functions').createFailHandler;
const redisClient = require('../db/redis_connect').connect();
const _ = require('underscore');

//只有房主能够解散房间
exports.dismissRoomHanler = (socket, io) => {
  //1. 首先检查是否是房主发出的请求
  //2, 检查游戏的状态，只有未开始的能够解散
  //3. 如果都满足，解散房间。

   return (msg, Ack) => {
    logger.debug("Receive DimissRoom: " + JSON.stringify(msg));

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

    let dismissRoom = (game) => {
      if (game.roomNo == "123456") {
        Ack({status: 0});
        io.to(msg.roomNo).emit(messages.DismissRoom, {roomNo: msg.roomNo})
      } else {
        return redisClient.delAsync(gameUtils.gameKey(msg.roomNo))
          .then(res => {
            if (!res) {
              logger.error("删除房间" + msg.roomNo + "失败");
              return;
            }
          })
      }
      return game;
    }

    getGame(msg.roomNo)
      .then(checkCreater)
      .then(checkState)
      .then(dismissRoom)
      .catch(createFailHandler(Ack));
   }
}