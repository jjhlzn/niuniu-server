"use strict";

const _ = require('underscore')
const logger = require('../../utils/logger').logger(require('path').basename(__filename));
const gameService = require('../../service/13/game_service')

exports.handle = async (req, res) => {
  var json = req.body;
  logger.debug("reqJson: " + JSON.stringify(json));
  let userId = json.userId;

  let game = await gameService.createThirteenShuiGame(userId, {})

  let resp = _.extend({status: 0}, {roomNo: game.roomNo, serverUrl: game.serverUrl})

  return res.end(JSON.stringify(resp));
}

