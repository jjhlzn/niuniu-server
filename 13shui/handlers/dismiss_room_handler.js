const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const gameService = require('../../service/13/game_service')
const messages = require('../messages')

exports.dismissRoomHanler = (socket, io) => {
    //1. 首先检查是否是房主发出的请求
    //2, 检查游戏的状态，只有未开始的能够解散
    //3. 如果都满足，解散房间。
     return (msg, Ack) => {

        json = JSON.parse(msg)
        let userId = json.userId
        let roomNo = json.roomNo

        let resp = gameService.dismissRoom(userId, roomNo)

        if (resp.result) {
            //通知所有的客户端房间已经解散
            io.to(roomNo).emit(messages.RoomHasDismiss, {roomNo: roomNo})
            Ack({status: 0})
        } else {
            Ack({status: -1, errorMessage: resp.errorMessage})
        }

     }
}