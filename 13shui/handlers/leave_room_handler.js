"use strict"

const _ = require('underscore')
const gameService = require('../../service/13/game_service')
const logger = require('../../utils/logger').logger(require('path').basename(__filename))
const messages = require('../messages')

//处理13水离开房间的请求
module.exports.leaveRoomHandler = (socket, io) => {
  return async (msg, Ack) =>  {
    logger.debug(msg)
    let json = JSON.parse(msg)
    let userId = json.userId;
    let roomNo = json.roomNo;
    
    let leaveResult = await gameService.leaveGame(json.userId, json.roomNo)

    if (!leaveResult) {
      logger.error('leave room error')
      Ack({status: -1})
    } else {
      if (Ack) {
        Ack({status: 0})
      }
      //emit some player leave 
      io.to(roomNo).emit(messages.SomeoneLeaveRoom, {roomNo: roomNo, userId: json.userId})

      //leave room
      socket.leave(roomNo)
    }
  }
}