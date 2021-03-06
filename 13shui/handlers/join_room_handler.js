"use strict";
const _ = require('underscore');
const gameService = require('../../service/13/game_service')
const logger = require('../../utils/logger').logger(require('path').basename(__filename))
const messages =  require('../messages')
const gameDao = require('../game_dao')

function createJoinRoomHandler(socket, io){
    return async (msg, Ack) => {
        logger.debug("join room: " + msg)
        let json = JSON.parse(msg)

        let roomNo = json.roomNo
        let userId = json.userId
        
        socket.roomNo = json.roomNo
        socket.userId = json.userId
        socket.gameType = "thirteenshui"

        let joinResult = await gameService.joinGame(json.userId, json.roomNo)

        let resp = {}
        //出错了
        if (!joinResult.game) {
            logger.error('error happened')
            Ack({status: -1});
            return resp
        } else {
            await gameDao.online(roomNo, userId)

            resp = _.extend({status: 0}, joinResult.game);
            logger.debug("join room response: " + JSON.stringify(resp));
            if (Ack) {
                Ack(resp);
            }
        
            let notify = {user: joinResult.user, roomNo: json.roomNo}
            //logger.debug(JSON.stringify(notify))
            io.to(roomNo).emit(messages.SomeoneJoinRoom, notify)

            socket.join(json.roomNo);
        }

        await gameService.checkAndStartRound(roomNo, io)
        return resp
    }
}

module.exports = {
    joinRoomHandler: createJoinRoomHandler
}