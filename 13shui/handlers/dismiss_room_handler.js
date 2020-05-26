const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const gameDao = require('../game_dao')
const userDao = require('../user_dao')
const GameState = require('../game_state').GameState
const messages = require('../messages')

exports.dismissRoomHandler = (socket, io) => {
     return async (msg, Ack) => {
        json = JSON.parse(msg)
        let userId = json.userId
        let roomNo = json.roomNo

        let resp = await dismissRoom(userId, roomNo)
 
        if (resp.result) {
            //通知所有的客户端房间已经解散
            io.to(roomNo).emit(messages.RoomHasDismiss, {roomNo: roomNo})
            Ack({status: 0})
        } else {
            Ack({status: -1, errorMessage: resp.errorMessage})
        }

     }
}



//1. 首先检查是否是房主发出的请求
//2, 检查游戏的状态，只有未开始的能够解散
//3. 如果都满足，解散房间。
async function dismissRoom(userId, roomNo) {
    let result = {
        errorMsg: '',
        result: false
    }

    //检查userid是否有效
    let user = await userDao.getUser(userId)
    if (!user) {
        logger.error(`can't find ${userId}`)
        return result
    }

    //检查roomNo是否有效
    let game = await gameDao.getGame(roomNo)
    if (!game) {
        logger.error(`can't find room: ${roomNo}`)
        return result
    }

    //检查房主
    if (game.creater != userId) {
        logger.debug("roomNo: " + roomNo + ", creater: " + game.creater);
        result.errorMsg = '你不是房主，不能解散房间'
        return result;
    }

    //检查游戏状态
    if (game.state != GameState.BeforeStart) {
        logger.debug("roomNo: " + game.roomNo + ", state: " + game.state);
        result.errorMsg = "当前游戏状态不能解散"
        return result;
    }

    //设置每个游戏玩家离开房间，
    let allPlayers = await gameDao.getPlayerIds(roomNo)
    let allPromises = allPlayers.map(userId => userDao.setUserLeaveGame(userId, game));
    await Promise.all(allPromises)
    result.result = true

    await gameDao.removeGameOnlyRedis(roomNo)

    return result
}