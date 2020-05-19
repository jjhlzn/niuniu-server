"use strict";

const gameState = require('../game_state');
const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const getGame = require('../niu/message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

let cur_iOS_version = '3.0.x';

function isAuditVersion(platform, version) {
  if (platform == 'iOS') {
    if (version == cur_iOS_version) {
      return true;
    }
  }
  return  false;
}

exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("checkIOSAuditVersion reqJson: " + JSON.stringify(json));

  let resp = {status: 0};
  
  resp.isAuditVersion = isAuditVersion(json.platform, json.version);

  res.end(JSON.stringify(resp));;
}