const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const gameService = require('../../service/13/game_service')
const messages = require('../messages')

exports.startGameHandler = async (socket, io) => {
    //1. 首先检查是否是房主发出的请求
    //2, 检查游戏的状态，只有未开始的能够解散
    //3. 如果都满足，解散房间。
     return async (msg, Ack) => {
        json = JSON.parse(msg)
        let userId = json.userId
        let roomNo = json.roomNo

        //set game state to redis and db

        //check all user is ready and all user is live 

        //if yes, start new round 
        let newRoundNotify = {}
        io.to(roomNo).emit(messages.NewRound, newRoundNotify)
     }
}