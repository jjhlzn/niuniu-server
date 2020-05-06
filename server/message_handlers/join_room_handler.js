"use strict";

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const gameState = require('../game_state');
const gameUtils = require('../db/game_utils');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
const connectRedis = require('../db/redis_connect').connect;
const userDao = require('../db/user_dao');
const _ = require('underscore');
const handleUserNotDelegate = require('./not_delegate_handler').handleUserNotDelegate;

//将游戏的状态传给客户端，房间可能不存在，
function joinRoomHandler(socket, io){
  return (msg, Ack) => {
    msg = JSON.parse(msg);
    gameUtils.logNewRequest("Join Room", msg)
    socket.roomNo = msg.roomNo;
    socket.userId = msg.userId;

    let checkRoomState = (game) => {
      if (game.state == gameState.GameOver ) {
        return Promise.reject("该房间不存在");
      }
      return game;
    };

    let setUserNotDelegate = (game) => {
      handleUserNotDelegate(io, msg.roomNo, msg.userId);
      return game;
    }

    /**
     * TODO: bug. 发送游戏的状态 到 加入游戏的过程中，有可能游戏的信息已经发生了变化，也就这个用户的客户端也就丢失了这部分信息，会导致问题。
     * 需要同步
     */
    let done = (game) => {
      //delete game.rounds;
      let resp = _.extend({status: 0}, game);
      logger.debug("join room response: " + JSON.stringify(resp));
      if (Ack)
        Ack(resp);
      socket.join(msg.roomNo);
    }

    getGame(msg.roomNo)
      .then(checkRoomState)
      .then(populateGame)
      .then(setUserNotDelegate)
      .then(done)
      .catch(createFailHandler(Ack));
    
  }
};

//因为获取几个 这里可能会出现状态不一致的情况，概率有多高
//设置Game对象的各个属性
function populateGame(game){
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
  let redisClient = connectRedis();
  let getSitdownPlayers = (game) => {
    return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(game.roomNo)).then(playerHash => {
      if (!playerHash) {
        playerHash = {};
      }
      let newHash = {};
      
      return userDao.getUsers( _.keys(playerHash) ).then( users => {
        users.forEach( user => {
          newHash[user.userId] = _.extend( {seat: playerHash[user.userId]}, _.pick(user, 'userId', 'nickname', 'headimgurl', 'ip', 'sex') );
        })

        logger.debug("sitdownPlayes: " +JSON.stringify(newHash));
        //TODO: 还需要加载用户的信息
        game.sitdownPlayers = newHash;
        return Promise.resolve(game);
      })
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
      //logger.debug(playerId + ": bets = " + JSON.stringify(round.players[playerId]))
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

  let getDelegatePlayers = (game) => {
    return redisClient.hgetallAsync(gameUtils.delegatePlayersKey(game.roomNo))
      .then( delegatePlayerHash => {
        if (!delegatePlayerHash) {
          delegatePlayerHash = {};
        }
        game.delegatePlayers = _.keys(delegatePlayerHash);
        return game;
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

  let populateRounds = (game) => {
    let rounds = [];
    let allUserIds = getUserIds(game);
    logger.debug("populateRounds called");
    return userDao.getUsers(allUserIds)
              .then( userInfos => {

                userInfos = userInfos.map( item => _.pick(item, 'userId', 'nickname', 'sex', 'headimgurl'));

                //logger.debug("userInfos: " + JSON.stringify(userInfos));
                let userInfoDict = {};
                userInfos.forEach( item => {
                  userInfoDict[item.userId] = item;
                });

                //logger.debug("userInfos: " + JSON.stringify(userInfos));
                //logger.debug("userInfoDict: " + JSON.stringify(userInfoDict));
                
                rounds = makeRounds(game, userInfoDict);
                game.rounds = rounds;
                return game;
              });
  }

  game.banker = "";
  //TODO：删除本局的其他用户的关于牌的信息
  if (game.state == gameState.BeforeStart) {
    return Promise.all([getSitdownPlayers(game), getDelegatePlayers(game), populateRounds(game)])
    .then( hashs => {
      return game;
    });
  } else if (game.state == gameState.RobBanker) {
    return Promise.all([getSitdownPlayers(game), getDelegatePlayers(game), getPlayerCards(game),
       getPlayerBets(game), getRobBankerPlayers(game), populateRounds(game)])
      .then( hashs => {
        return game;
      });
  } else if (game.state == gameState.Bet) {
    game.banker = game.rounds[game.rounds.length - 1].banker;
    return Promise.all([getSitdownPlayers(game), getDelegatePlayers(game), getPlayerCards(game),
       getPlayerBets(game),  getBetPlayers(game), populateRounds(game)])
    .then(hashs => {
      return game;
    })
  } else if (game.state == gameState.CheckCard) {
    game.banker = game.rounds[game.rounds.length - 1].banker;
    return Promise.all([getSitdownPlayers(game), getDelegatePlayers(game), getPlayerCards(game),
       getPlayerBets(game),  getBetPlayers(game), getShowcardPlayers(game), populateRounds(game)])
    .then(hashs => {
      return game;
    })
  } else if (game.state == gameState.WaitForNextRound) {
    return Promise.all([getSitdownPlayers(game), getDelegatePlayers(game),
       getReadyPlayers(game)], populateRounds(game))
      .then( hashs => {
        return game;
      });
  } else {
    return Promise.reject("join room中无法识别的游戏状态，state = " + game.state);
  }
}

function getUserIds(game) {
  logger.debug("getUserIds called");
  let userIds = new Set();
  //logger.debug("rounds = " + JSON.stringify(game.rounds));
  game.rounds.forEach( item => {
    let ids = _.keys(item.players);
    //logger.debug("ids = " + JSON.stringify(ids));
    ids.forEach( id => {
      userIds.add(id);
    })
  });

  let result = [];
  userIds.forEach( i => result.push(i) );
  return result;
}

function makeRounds(game, userInfoDict) {
  let rounds = [];

  game.rounds.forEach( item => {
    let round = {
      playerCardsDict: {},
      playerBets: {},
      niuArray: {},
      multipleArray: {},
      resultDict: {},
      cardSequenceArray: {}
    };
    round.banker = item.banker;
    let userIds = _.keys(item.players);
    round.players = userIds.map( userId => userInfoDict[userId] );
    
    userIds.forEach( userId => {
      round.playerCardsDict[userId] = item.players[userId].cards;
      round.playerBets[userId] = item.players[userId].bet;
      round.niuArray[userId] = item.players[userId].niu;
      round.multipleArray[userId] = item.players[userId].multiple;
      round.resultDict[userId] = item.players[userId].winOrLoss;
      round.cardSequenceArray[userId] = item.players[userId].cardSequences;
      round.startTime = item.startTime;
      round.endTime = item.endTime;
    });

    rounds.push(round);
  });

  return rounds;
}

/*
function modifyLatestRound(game) {
  let rounds = game.rounds;
  if (rounds.length > 0) {
    let curRournd = rounds[rounds.length - 1];
    curRournd.playerBets = game.playerBets;
    curRournd.resultDict =game.resultDict;
  }
}*/

module.exports = {
  joinRoomHandler: joinRoomHandler,
  populateGame: populateGame
}