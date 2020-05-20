"use strict";
const gameState = require('../game_state');
const connectRedis = require('../db/redis_connect').connect;
const gameUtils = require('../db/game_utils');
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const makeServerUrl = require('../db/game_server').makeServerUrl;
const userDao = require('../db/user_dao');
const gameDao = require('../db/game_dao');


const niuHandler = require('./niu/niu_create_room_handler').handle
const thirteenshuiHandler = require('./13/13_create_room_handler').handle

exports.handle = (req, res) => {
  var json = req.body;
  let userId = json.userId;

  if (json.gameType == 'thirteenshui') {
    thirteenshuiHandler(req, res)
  } else {
    
    niuHandler(req, res)
  } 
}
