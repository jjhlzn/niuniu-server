"use strict"

const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const gameService = require('../../service/13/game_service')
const messages = require('../messages')
const userDao = require('../user_dao')
const gameDao = require('../game_dao')
const connectRedis = require('../../db2/redis_connect')
const GameState = require('../game_state').GameState
const RoundState = require('../game_state').RoundState

exports.readyHandler = async (socket, io) => {
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

        //check game state and round state
        if (game.state == GameState.GameOver) {
            logger.debug("round state is " + game.GameState)
            Ack({status: -1})
            return
        }

        if (game.roundState != RoundState.BeforeStart) {
            logger.debug("round state is " + game.roundState)
            Ack({status: -1})
            return
        }

        //把用户加入到ready的hash表中
        var client = connectRedis();
        await client.hsetAsync(gameUtils.readyPlayersKey(roomNo), userId, "")

        io.to(roomNo).emit(messages.SomeoneReady, {roomNo: roomNo, userId: userId})
        Ack({status: 0})
     }
}