"use strict";

const gameState = require('../game_state');
const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const getGame = require('../message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

let cur_android_verson = '3.0.4';

function isNeedUpdate(platform, version) {
  if (platform == 'Android') {
    if (version != cur_android_verson) {
      return true;
    }
  }
  return  false;
}

exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("checkUpdate reqJson: " + JSON.stringify(json));

  let resp = { };
  
  resp.isNeedUpdate = isNeedUpdate(json.platform, json.version);
  if (resp.isNeedUpdate) {
    resp.updateUrl = "http://www.hengdianworld.com/images/niuniu.apk";
  }

  res.end(JSON.stringify(resp));;
}