"use strict";

const gameState = require('../game_state');
const connectRedis = require('../db/redis_connect').connect;
const mongoConnect = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;
const gameUtils = require('../db/game_utils');
const getGame = require('../niu/message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const moment = require('moment');

exports.handle = (req, res) => {
  var json = req.body;
  logger.debug("report_error reqJson: " + JSON.stringify(json));
  let mongoConnection = mongoConnect();

  if (process.env.NODE_ENV == 'production') {
    mongoConnection.then(db =>{
      db.collection('client_error_reports').insertOne(_.extend({createTime: moment().format('YYYY-MM-DD HH:mm:ss')}, json))
        .then( result => {
          if (result.result.ok != 1) {
            logger.debug("插入error report失败");
          }
        });
    });
  }

  res.end(JSON.stringify({status: 0}));
}