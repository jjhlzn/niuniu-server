"use strict";

const _ = require('underscore');

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));


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


module.exports = {
  gameKey: roomNo => {
    return 'room:' + roomNo;
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

  readyPlayersKey: roomNo => {
    return 'readyplayers:' + roomNo;
  },

  /*
  robBankerTimeout: 600000,
  betTimeout: 600000,
  showCardTimeout: 600000,
  readyTimeout: 600000,
  */

  robBankerTimeout: 1000 * 60 * 60 * 24 * 10, //10天
  betTimeout:   1000 * 60 * 60 * 24 * 10,
  showCardTimeout:   1000 * 60 * 60 * 24 * 10,
  readyTimeout:   1000 * 60 * 60 * 24 * 10,

  currentRoundPlayerIds: currentRoundPlayerIds,
  currentRound: currentRound,
  currentRoundPlayerInfos: currentRoundPlayerInfos,
  hasNextRound: hasNextRound
}
