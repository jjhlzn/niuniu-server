"use strict";

const gameState = require('../game_state');
const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const getGame = require('../niu/message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

let cur_android_verson = '3.0.1';
let cur_iOS_version = '3.0.1';

function isNeedUpdate(platform, version) {
  if (platform == 'Android') {
    if (version != cur_android_verson) {
      return true;
    }
  } else if (platform == 'iOS') {
    if (version != cur_iOS_version) {
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
  if (resp.isNeedUpdate && json.platform == 'Android') {
    resp.newVersion = cur_android_verson;
    resp.updateUrl = "http://www.hengdianworld.com/images/niuniu.apk";
  } else if (resp.isNeedUpdate && json.platform == 'iOS') {
    resp.newVersion = cur_iOS_version;
  }

  res.end(JSON.stringify(resp));;
}