"use strict";

const _ = require('underscore');

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const deck = require('../deck');
const moment = require('moment');

function setWinOrLoss(game, playerId, bankerId, playerInfo, bankerInfo) {
  let isBankerWin = true;
  if (playerInfo.niu > bankerInfo.niu) {
    isBankerWin = false;
  } else if (playerInfo.niu < bankerInfo.niu) {
    isBankerWin = true;    
  } else { //牛相等的情况，看看最大的那种牌谁大
    let biggest1 = playerInfo.cards.sort(deck.compare).reverse()[0];
    let biggest2 = bankerInfo.cards.sort(deck.compare).reverse()[0];
  if (deck.compare(biggest1, biggest2) == 1) {
      isBankerWin = false;
    } else {
      isBankerWin = true;
    }
  }

  if (isBankerWin) {
    playerInfo.winOrLoss = playerInfo.bet * bankerInfo.multiple * -1;
  } else {
    playerInfo.winOrLoss = playerInfo.bet * playerInfo.multiple;
  }
  bankerInfo.winOrLoss += playerInfo.winOrLoss * -1;

  game.scores[playerId] += playerInfo.winOrLoss;

  logger.debug(playerId + ": " + JSON.stringify(playerInfo));
}

//计算游戏当前局的输赢关系
function computeWinOrLoss(game) {
  let round = game.rounds[game.rounds.length - 1];
  round.endTime = moment().format('YYYY-MM-DD HH:mm:ss');
  let bankerId = round.banker;
  let playersDict = round.players;
  _.keys(playersDict).forEach(playerId => {
    if (game.scores[playerId] === undefined) {
      game.scores[playerId] = 0;
    }
  });
  logger.debug("game.scores: " + JSON.stringify(game.scores));
  let playerIds = _.keys(playersDict).filter( playerId => {return playerId != bankerId});
  let bankerInfo = playersDict[bankerId];

  playerIds.forEach( (playerId, i) => {
    setWinOrLoss(game, playerId, bankerId, playersDict[playerId], bankerInfo); 
  });
  game.scores[bankerId] += bankerInfo.winOrLoss;
  logger.debug(bankerId + ": " + JSON.stringify(bankerInfo));

  //检验本局的结果是否加以来为0
  let result = 0;
  _.keys(playersDict).forEach(playerId => {
    result +=  playersDict[playerId].winOrLoss;
  })

  if (result != 0) {
    throw "本局结果加起来不为0，roundNo = " + game.currentRoundNo;
  }

  //检验全局的结果是否加起来为0
  result = 0
  let scoreDict = game.scores;
  _.keys(scoreDict).forEach(playerId => {
    result += scoreDict[playerId];
  })
  logger.debug("game.scores: " + JSON.stringify(game.scores));
  if (result != 0) {
    throw "全局结果加起来不为0，roundNo = " + game.currentRoundNo;
  }
}


function currentRoundPlayerIds(game) {
  return _.keys(game.rounds[game.rounds.length - 1]['players']);
}

function currentRound(game) {
  return game.rounds[game.rounds.length - 1];
}

function currentRoundPlayerInfos(game) {
  return game.rounds[game.rounds.length - 1]['players'];
}

function hasNextRound(game) {
  return game.currentRoundNo < game.totalRoundCount;
}

function logNewRequest(name, msg) {
  logger.info("--------------------------------GET NEW REQUEST--------------------------------")
  logger.info('Receive ' + name + ": " + JSON.stringify(msg));
}


module.exports = {
  gameKey: roomNo => {
    return 'room:' + roomNo;
  },

  userKey: userId => {
    return 'user:' + userId;
  },

  sitdownPlayersKey: roomNo => {
    return 'sitdownplayers:' + roomNo;
  },

  robBankersKey: roomNo => {
    return 'robbankers:' + roomNo;
  },

  betPlayersKey: roomNo => {
    return 'betplayers:' + roomNo;
  },

  showcardPlayersKey: roomNo => {
    return 'showcardplayers:' + roomNo;
  },

  delegatePlayersKey: roomNo => {
    return 'delegateplayers:' + roomNo;
  },

  readyPlayersKey: roomNo => {
    return 'readyplayers:' + roomNo;
  },

  offlinePlayersKey: roomNo => {
    return 'offlineplayers:' + roomNo
  },

  userCardsKey: roomNo => {
    return 'userCards:' + roomNo
  },

  userCardsResultKey: roomNo => {
    return 'userCardsResult:' + roomNo
  },

  userScoresKey: roomNo => {
    return 'userScores:' + roomNo
  },
  /*
  robBankerTimeout: 10000,
  betTimeout: 6000,
  showCardTimeout: 6000,
  readyTimeout: 6000,
  */

  
  robBankerTimeout: 13000,
  betTimeout: 12800,
  showCardTimeout: 12400,
  readyTimeout: 16000,



/*
  robBankerTimeout: 1000 * 60 * 60 * 24 * 10, //10天
  betTimeout:   1000 * 60 * 60 * 24 * 10,
  showCardTimeout:   1000 * 60 * 60 * 24 * 10,
  readyTimeout:   1000 * 60 * 60 * 24 * 10,
  */

  currentRoundPlayerIds: currentRoundPlayerIds,
  currentRound: currentRound,
  currentRoundPlayerInfos: currentRoundPlayerInfos,
  hasNextRound: hasNextRound,

  computeWinOrLoss: computeWinOrLoss,

  logNewRequest: logNewRequest
}
