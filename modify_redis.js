"use strict"

const gameDao = require('./13shui/game_dao')

async function fixData() {
    let game = await gameDao.getGame("346614")
    game.roundState = "BeforeStart"
    await gameDao.saveGame(game)
    return await gameDao.getGame("346614")
}

fixData().then( res => {console.log(res)})