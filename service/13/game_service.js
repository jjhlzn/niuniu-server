"use strict"
/**
 * 为什么把在各个handler的逻辑放到gameService中？
 * 好处？
 * 1. 解耦req, res, 方便测试
 * 坏处？
 * 1. 这个类会很大，逻辑很复杂，
 */
const connectRedis = require('../../db/redis_connect').connect;
const gameUtils = require('../../db/game_utils');
const moment = require('moment')
const _ = require('underscore');
const logger = require('../../utils/logger').logger(require('path').basename(__filename));
const makeServerUrl = require('../../db/game_server').makeServerUrl;
const userDao = require('../../13shui/user_dao');
const gameDao = require('../../13shui/game_dao');
const GameState = require('../../13shui/game_state').GameState

async function createThirteenShuiGame(userId, gameParameters) {
    //判断用户是否已经在游戏中
    //如果不在游戏中，则创建一个新的13道游戏，让创建该游戏的用户在游戏中，最后返回该游戏
    let user = await userDao.getUser(userId)
    if (!user) {
        logger.error(`can't find ${userId}`)
        return null
    }

    if (user.currentRoomNo) {
        let game = await gameDao.getGame(user.currentRoomNo)
        if (game) {
            return game
        }
    }

    game = await _createGame(userId)

    let client = await connectRedis()
    client.setAsync(gameUtils.gameKey(game.roomNo), JSON.stringify(game))

    user.seatNo = 'A'
    await userDao.setUserInGame(user, game);
    
    return game;
}

/**
 * 如果用户已经在这个房间了，也算正常，
 */
async function joinGame(userId, roomNo) {
    let result = {
        errorMsg: '',
        game: null,
        user: null
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

    //检查玩家是否已经在游戏中了
    var anotherGame = await checkUserInGame(userId)
    if(anotherGame) {
        if(anotherGame.roomNo != roomNo) {
            logger.error(`user[${userId}] has in game[${roomNo}]`)
            result.errorMsg = "用户已经在游戏中了"
            return result
        } else {
            game = anotherGame
        }
    } else {
        //设置玩家列表
        game.players = await gameDao.getPlayerIds(roomNo)

        //检查游戏的状态是否还能加入，如果已经开始就不能了
        if (game.state != GameState.BeforeStart) {
            logger.debug(`game[${roomNo}] game state is wrong, game.state is ${game.state}`)
            return result;
        }

        //检查房间是否还能加人
        let curPlaysCnt = game.players.length
        if (curPlaysCnt >= game.maxPlayers) {
            logger.debug(`game[${roomNo}] is full`)
            result.errorMsg = "房间已满"
            return result
        }

        //把玩家加入到房间中
        let sitResult = await sitdownOnAnySeat(user, game)
        if(!sitResult) {
            logger.debug(`user[${user.userId}] game[${roomNo}] sit down fail`)
            return result
        }
       
    }

     //更新玩家列表，把自己加上
     game.players = await gameDao.getPlayerIds(roomNo)

    var playerInfos = []
    for(var i = 0; i < game.players.length; i++) {
        playerInfos.push(await userDao.getUser(game.players[i]))
    }
    game.players = playerInfos

    var playerSeatDict = await gameDao.getPlayerSeatDict(roomNo)
    var readyUsers = await gameDao.getReadyUsers(roomNo)
    var offlineUsers = await gameDao.getOfflineUsers(roomNo)

    game.players.forEach(player => {
        player.seatNo = playerSeatDict[player.userId]
        player.isReady = _.contains(readyUsers, player.userId)
        player.isOffline = _.contains(offlineUsers, player.userId)
    });

    //返回这个房间
    result.game = game
    result.user = user

    return result
}

async function canStartNewRound(roomNo) {
    throw 'not implemented'
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

async function leaveGame(userId, roomNo) {
    //检查userid是否有效
    let user = await userDao.getUser(userId)
    if (!user) {
        logger.error(`can't find ${userId}`)
        return false
    }

    //检查roomNo是否有效
    let game = await gameDao.getGame(roomNo)
    if (!game) {
        logger.error(`can't find room: ${roomNo}`)
        return false
    }

    //设置user的信息
    await userDao.setUserLeaveGame(user, game)
    return true

}

//检查是否满足开局的条件，游戏已经开始，人数达标，所有都已经准备，所有人都在线
async function checkAndStartRound(roomNo, io) {
    //1. 检查游戏的状态

    //2. 检查人数

    //3. 检查所有人都准备

    //4. 检查所有人在线

    //发牌 并且 存储发牌的结果
    //给玩家发送新一局的通知
}

async function checkAndSendCompareCardsNotify(roomNo,  io) {
    //1. 检查是否所有人都已经发送了摆牌结束的消息
    
    //2. 如果是，服务器端进行比牌，并且把存储比牌的结果，

    //2. 通知客户端进行比牌，通知内容包括：每个人的摆拍结果，以及分数，分数以服务器端为准
}

async function getGame4Debug(roomNo) {
    let game = await gameDao.getGame(roomNo)
    if (!game) {
        logger.error(`can't find room: ${roomNo}`)
        return null
    }

    await gameDao.loadSitdownPlayerIds(game)
    return game
}

async function checkUserInGame(userId) {
    let user = await userDao.getUser(userId)
    if (!user) {
        logger.error(`can't find ${userId}`)
        return null
    }

    if (user.currentRoomNo) {
        let game = await gameDao.getGame(user.currentRoomNo)
        if (game) {
            return game
        }
    }
}

async function _createGame(userId) {
    let game = {};
    game.creater = userId;
    game.totalRoundCount = 10;
    game.createTime = moment().format('YYYY-MM-DD hh:mm:ss');
    game.currentRoundNo = 1;
    game.maxPlayers = 4;
    game.players = [];
    game.rounds = [];
    game.scores = {};
    game.state = GameState.BeforeStart;
    game.gameType = "thirteenshui";
    game.serverUrl = makeServerUrl(game)
    await generateRoomNo(game)
    return game;
}

async function sitdownOnAnySeat(user, game) {
    //获取座位，
    var emptySeatNos = await gameDao.getEmptySeats(game)
    if (emptySeatNos.length == 0) {
        return false
    }

    var seatNo = emptySeatNos[0]
    //坐下设置
    //将game信息保存到redis中，
    //将user信息保存到redis中
    user.seatNo = seatNo
    await userDao.setUserInGame(user, game);
    
    return true
} 

async function generateRoomNo(game) {
    game.roomNo = getRandomRoomNo();
    logger.debug("roomNo = " + game.roomNo);
    return connectRedis().existsAsync(gameUtils.gameKey(game.roomNo))
        .then(exists => {
            if (exists) {
                return generateRoomNo(game);
            }
            return game;
        })
}

function getRandomRoomNo() {
    let str = "";
    for (var i = 0; i < 6; i++) {
        str += Math.floor(Math.random() * 10000000 % 10);
    }
    return str;
}

module.exports = {
    createThirteenShuiGame: createThirteenShuiGame,
    joinGame: joinGame,
    leaveGame: leaveGame,
    getGame4Debug: getGame4Debug
}

/*
createThirteenShuiGame('7654321', {}).then(game => {
    console.log(game)
        joinGame('test1', game.roomNo)
        .then(result => {
            console.log(result)
            dismissRoom('7654321', game.roomNo).then(result => console.log(result))
        })
})*/
//joinGame('test1', '795249').then(result => console.log(result))
