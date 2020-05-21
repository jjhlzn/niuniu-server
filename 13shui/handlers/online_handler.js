"use strict"

const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const messages = require('../messages')
const userDao = require('../user_dao')
const gameDao = require('../game_dao')
const connectRedis = require('../../db2/redis_connect')
const GameState = require('../game_state').GameState
const RoundState = require('../game_state').RoundState

exports.onlineHandler = async (socket, io) => {
     return (msg, Ack) => {
        json = JSON.parse(msg)
        let userId = json.userId
        let roomNo = json.roomNo

        //检查userid是否有效
        let user = await userDao.getUser(userId)
        if (!user) {
            logger.error(`can't find ${userId}`)
            Ack({status: -1})
            return
        }

        //检查roomNo是否有效
        let game = await gameDao.getGame(roomNo)
        if (!game) {
            logger.error(`can't find room: ${roomNo}`)
            Ack({status: -1})
            return
        }
        
        await gameDao.online(roomNo, userId)

        //将这个通知通知所有的玩家
        io.to(roomNo).emit(messages.SomeoneOneline, {userId: userId,  roomNo: roomNo})
        Ack({status: 0})
    }
}