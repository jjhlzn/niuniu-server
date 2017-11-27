"use strict";

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const gameState = require('../game_state');
const gameUtils = require('../db/game_utils');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
const redisClient = require('../db/redis_connect').connect();
const _ = require('underscore');


function getImageUrl() {
  let imageUrls = [
    'http://p3.wmpic.me/article/2015/03/16/1426483394_eJakzHWr.jpeg',
    'http://is2.mzstatic.com/image/thumb/Purple122/v4/e5/ab/bc/e5abbc78-16cd-c1fc-8b69-503e70c50e16/source/1200x630bb.jpg',
    'http://scimg.jb51.net/touxiang/201709/2017091018241774.jpg',
    'http://www.vstou.com/upload/image/22/201612/1481847190163497.jpg',
    'http://downza.img.zz314.com/edu/pc/wlgj-1008/2016-03-31/77660051d89fb05f2ba64138ebf965e6.jpg',
    'http://www.jf258.com/uploads/2015-05-14/191202223.jpg',
    'http://m.mmwnn.com/dmtp/mimg/toxi/nv/tox566.jpeg',
    'http://www.85s.com/wp-content/uploads/2016/07/QQ%E6%88%AA%E5%9B%BE20160729180738_%E5%89%AF%E6%9C%AC.jpg',
    'http://www.85s.com/wp-content/uploads/2016/07/QQ%E6%88%AA%E5%9B%BE20160729180633_%E5%89%AF%E6%9C%AC.jpg',
    'http://www.85s.com/wp-content/uploads/2016/07/QQ%E6%88%AA%E5%9B%BE20160729180714_%E5%89%AF%E6%9C%AC.jpg'
  ];
  let index = Math.round( Math.random() * 1000000 ) % imageUrls.length;
  return imageUrls[index];
}

function getUserInfo(userId) {
  return {headImageUrl: getImageUrl(), nickName: userId, sex: 1, ip: "192.168.0.1"}
}

//将游戏的状态传给客户端，房间可能不存在，
exports.joinRoomHandler = (socket, io) => {
  return (msg, Ack) => {
    logger.debug("Receive JoinRoom: " + JSON.stringify(msg));

    let checkRoomState = (game) => {
      if (game.state == gameState.GameOver ) {
        return Promise.reject("该房间不存在");
      }
      return Promise.resolve(game);
    };

    let getSitdownPlayers = (game) => {
      return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(game.roomNo)).then(playerHash => {
        if (!playerHash) {
          playerHash = {};
        }
        let newHash = {};
        _.keys(playerHash).forEach(item => {newHash[item] = _.extend( {seat: playerHash[item]}, getUserInfo(item))});
        logger.debug("sitdownPlayes: " +JSON.stringify(newHash));
        //TODO: 还需要加载用户的信息
        game.sitdownPlayers = newHash;
        return Promise.resolve(game);
      });
    }

    let getPlayerCards = (game) => {
      let round = game.rounds[game.rounds.length - 1];
      let playerIds = _.keys(round.players);
      game.playerCards = {};
      playerIds.forEach(playerId => {
        if (game.state == gameState.CheckCard)
          game.playerCards[playerId] = round.players[playerId].cards;
        else 
          game.playerCards[playerId] = round.players[playerId].cards.slice(0, round.players[playerId].cards.length - 1);
         
      });
      return Promise.resolve(game);
    }

    let getPlayerBets = (game) => {
      let round = game.rounds[game.rounds.length - 1];
      let playerIds = _.keys(round.players);
      game.playerBets = {};
      playerIds.forEach(playerId => {
        logger.debug(playerId + ": bets = " + JSON.stringify(round.players[playerId]))
        game.playerBets[playerId] = round.players[playerId].bets;
      });
      return Promise.resolve(game);
    }

    let getRobBankerPlayers = (game) => {
      return redisClient.hgetallAsync(gameUtils.robBankersKey(game.roomNo)).then(
        robBankerHash => {
          if (!robBankerHash) {
            robBankerHash = {};
          }
          _.keys(robBankerHash).forEach( playerId => {
            if (robBankerHash[playerId] == 1) {
              robBankerHash[playerId] = true
            } else {
              robBankerHash[playerId] = false;
            }
          })
          game.robBankerPlayers = robBankerHash;
          return Promise.resolve(game);
        }
      )
    }

    let getBetPlayers = (game) => {
      return redisClient.hgetallAsync(gameUtils.betPlayersKey(game.roomNo))
      .then( betPlayerHash => {
        if (!betPlayerHash) {
          betPlayerHash = {};
        }
        game.betPlayers = betPlayerHash;
        return Promise.resolve(game);
      });
    }

    let getShowcardPlayers = (game) => {
      return redisClient.hgetallAsync(gameUtils.showcardPlayersKey(game.roomNo))
      .then( showcardPlayerHash => {
        if (!showcardPlayerHash) {
          showcardPlayerHash = {};
        }
        let round = game.rounds[game.rounds.length - 1];
        let result = {};
        _.keys(showcardPlayerHash).forEach( playerId => {
          result[playerId] = {niu: round.players[playerId].niu, multiple: round.players[playerId].multiple, cards: round.players[playerId].cards, cardSequences: round.players[playerId].cardSequences}
        });
        game.showcardPlayers = result;
        return Promise.resolve(game);
      });
    }

    let getReadyPlayers = (game) => {
      return redisClient.hgetallAsync(gameUtils.readyPlayersKey(game.roomNo))
      .then( readyPlayerHash => {
        if (!readyPlayerHash) {
          readyPlayerHash = {};
        }
        logger.debug("readyPlayers: " +JSON.stringify(readyPlayerHash));
        game.readyPlayers = readyPlayerHash;
        return Promise.resolve(game);
      });
    }

    //因为获取几个 这里可能会出现状态不一致的情况，概率有多高
    let populateGame = (game) => {
        //如果已经经过第一次发牌，需要传递4张牌的信息
        //如果过了第二次发牌，需要传递5张牌的信息
        //传递可下注的信息
        /*
        BeforeStart: "BeforeStart",    ++++现在坐着的用户信息
        FirstDeal: "FirstDeal",        ----服务器没有这个状态---
        RobBanker: "RobBanker",        ++++已经抢庄的玩家
        ChooseBanker: 'ChooseBanker',  ----服务器没有这个状态---
        Bet: "Bet",                    ++++已经下注的玩家
        SecondDeal: "SecondDeal",      ----服务器没有这个状态---
        CheckCard: "CheckCard",        ++++已经亮牌的玩家
        CompareCard: "CompareCard",    ----服务器没有这个状态---
        WaitForNextRound: "WaitForNextRound", ++++已经准备好的玩家
        GameOver: "GameOver",
        Ready: "Ready"
        */
       
        
        game.banker = "";
        //TODO：删除本局的其他用户的关于牌的信息
        if (game.state == gameState.BeforeStart) {
          return getSitdownPlayers(game).then(game => {
            return Promise.resolve(game)
          })
        } else if (game.state == gameState.RobBanker) {
          return Promise.all([getSitdownPlayers(game), getPlayerCards(game), getPlayerBets(game), getRobBankerPlayers(game)])
            .then( hashs => {
              return Promise.resolve(game);
            });
        } else if (game.state == gameState.Bet) {
          game.banker = game.rounds[game.rounds.length - 1].banker;
          return Promise.all([getSitdownPlayers(game), getPlayerCards(game), getPlayerBets(game),  getBetPlayers(game)])
          .then(hashs => {
            return Promise.resolve(game);
          })
        } else if (game.state == gameState.CheckCard) {
          game.banker = game.rounds[game.rounds.length - 1].banker;
          return Promise.all([getSitdownPlayers(game), getPlayerCards(game), getPlayerBets(game),  getBetPlayers(game), getShowcardPlayers(game)])
          .then(hashs => {
            return Promise.resolve(game);
          })
        } else if (game.state == gameState.WaitForNextRound) {
          return Promise.all([getSitdownPlayers(game), getReadyPlayers(game)])
            .then( hashs => {
              return Promise.resolve(game);
            });
        } else {
          return Promise.reject("join room中无法识别的游戏状态，state = " + game.state);
        }
    }

    let done = (game) => {
      delete game.rounds;
      if (Ack)
        Ack(_.extend({status: 0}, game));
      socket.join(msg.roomNo);
    }

    getGame(msg.roomNo)
      .then(checkRoomState)
      .then(populateGame)
      .then(done)
      .catch(createFailHandler(Ack));
    
  }
};

