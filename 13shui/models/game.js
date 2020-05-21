'use strict'
/**
 * 暂时没有用
 */
class Game {
    constructor(obj) {

    }
    roomNo = ''   //房间号
    creater = ''  //创建者的userId
    minPlayers = 0
    maxPlayers = 4
    roundCount  = 10
    gameType = "thirteenshui"
    gameState = ''       //游戏的当前状态
    players = []
    seatAndPlayerDict = {}  //座位号和玩家的dict { 'A': {userId: '7, 6, 5, 4, 3'}}
    Rounds = []    //局的历史
    currentRound = {}
    setGameState(gameState) {
        throw 'not implemented'
    }
}

class Round {
    game = {}
    roundNo = 0
    state = ''
    readyUsers = []            //userid list
    offlineUsers = []          //userid list
    finishPlaceCardsUsers = [] //userid list

    canStart() {
        throw 'not implemented'
    }

    setRoundState(roundState) {
        throw 'not implemented'
    }
}


var game = new Game()
console.log(game.maxPlayers)
game.getMaxPlayers()