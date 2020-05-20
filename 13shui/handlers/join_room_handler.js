"use strict";
const _ = require('underscore');
const gameService = require('../../service/13/game_service')
const logger = require('../../utils/logger').logger(require('path').basename(__filename))

function createJoinRoomHandler(socket, io){
    return async (msg, Ack) => {
        logger.debug("13shui join room")
        logger.debug(msg)
        let json = JSON.parse(msg)

        socket.roomNo = json.roomNo
        socket.userId = json.userId

        let joinResult = await gameService.joinGame(json.userId, json.roomNo)

        //出错了
        if (!joinResult.game) {
            logger.error('error happened')
            Ack({status: -1});
        } else {
            let resp = _.extend({status: 0}, joinResult.game);
            logger.debug("join room response: " + JSON.stringify(resp));
            if (Ack) {
                Ack(resp);
            }

            //TODO: emit some player join

            socket.join(json.roomNo);
        }
    }
}

module.exports = {
    joinRoomHandler: createJoinRoomHandler
}