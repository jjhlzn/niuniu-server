"use strict";

var url = require('url');
var querystring = require('querystring');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const userDao = require('../db/user_dao');
const connectRedis = require('../db/redis_connect').connectRedis;
const getGame = require('../niu/message_handlers/share_functions').getGame;
/*
   reqJson = {
      userId:  ''
   }
*/

exports.handle = (req, res) => {
  logger.debug("req.query: ", JSON.stringify(req.url.query));
  res.setHeader('Content-Type', 'application/json');

  var params = querystring.parse(url.parse(req.url).query);

  let jsonStr = params['req'];
  let json = JSON.parse(jsonStr);
  logger.debug("userId: " + json.userId);

  let resp = {
    status: 0,
    userId: json.userId,
    isInGame: false
  };

  let failHandler = (err) => {
    if(err) {
      console.error(err)
    }
    resp.status = -1;
    resp.end(JSON.stringify(resp));
  }
  
  userDao.getUser(json.userId)
    .then( user => {
      if (user.currentRoomNo) {
        resp.isInGame = true;
        resp.roomNo = user.currentRoomNo;

        getGame(resp.roomNo).then(game => {
          resp.serverUrl = game.serverUrl;
          resp.gameType = game.gameType
          res.end(JSON.stringify(resp));
        }).catch(failHandler);

      } else {
        resp.isInGame = false;
        resp.roomNo = "";
        res.end(JSON.stringify(resp));
      }
    }).catch(failHandler);
}