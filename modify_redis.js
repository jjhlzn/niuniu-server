"use strict"

const gameDao = require('./13shui/game_dao')
const userDao = require('./13shui/user_dao')
const connectRedis = require('./db2/redis_connect').connect
const gameUtils = require('./db/game_utils')

async function fixData() {
    let game = await gameDao.getGame("346614")
    game.roundState = "BeforeStart"
    await gameDao.saveGame(game)
    return await gameDao.getGame("346614")
}

async function removeGame(roomNo) {
    let game = await gameDao.getGame(roomNo)
    let client = connectRedis()
    await client.delAsync(gameUtils.gameKey(roomNo))
}

async function setUser(userId) {
    let client = connectRedis()
    let user = await userDao.getUser(userId)
    user.currentRoomNo = ''
    await client.setAsync(gameUtils.userKey(userId), JSON.stringify(user))
}

//fixData().then( res => {console.log(res)})
//removeGame('346614').then(res => console.log(res))
setUser('7654321').then(res => console.log(res) )
