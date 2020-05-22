const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const gameService = require('../../service/13/game_service')
const messages = require('../messages')
const gameDao = require('../game_dao')
const userDao = require('../user_dao')
const GameState = require('../game_state').GameState
const RoundState = require('../game_state').RoundState

exports.startGameHandler =  (socket, io) => {
    //1. 首先检查是否是房主发出的请求
    //2, 检查游戏的状态，只有未开始的能够解散
    //3. 如果都满足，解散房间。
     return async (msg, Ack) => {
        logger.debug("start game request: " + msg)

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

        //检测是否已经处于开始状态
        if (game.state != GameState.BeforeStart) {
           logger.debug("game state is not beforestart: state is " + game.state)
           return;
        }

        //set game state to redis and db
        game.state = GameState.Playing
        game.roundState = GameState.BeforeStart
        await gameDao.ready(roomNo, userId)
        await gameDao.saveGame(game)

        //check all user is ready and all user is live 
        //if yes, start new round 
        await gameService.checkAndStartRound(roomNo, io)
     }
}