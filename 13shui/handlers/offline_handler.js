"use strict";
const _ = require('underscore');

const logger = require('../../utils/logger').logger(require('path').basename(__filename))
const messages =  require('../messages')
const gameDao = require('../game_dao')
const userDao = require('../user_dao')

async function offlineHandler(io, roomNo, userId){
  //检查userid是否有效
  let user = await userDao.getUser(userId)
  if (!user) {
      logger.error(`can't find ${userId}`)
      return
  }

  //检查roomNo是否有效
  let game = await gameDao.getGame(roomNo)
  if (!game) {
      logger.error(`can't find room: ${roomNo}`)
      return
  }

  await gameDao.offline(roomNo, userId)

  io.to(roomNo).emit(messages.SomeoneOffline, {userId: userId, roomNo: roomNo})
}

module.exports = {
    offlineHandler: offlineHandler
}