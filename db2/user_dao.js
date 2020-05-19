
const _ = require('underscore');
const logger = require('../utils/logger').logger(require('path').basename(__filename));
const connectRedis = require('./redis_connect').connect;
const connectMongo = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('./mongo_connect').closeMongoConnect;

const gameUtils = require('../db/game_utils');

async function getUser(userId) {
  let client = connectRedis()
  var user = await client.getAsync(gameUtils.userKey)
  if (!user) {
    logger.debug("Redis中找不到该用户: userId = " + userId + ", 尝试从MongoDB中查找");
    let mongoClient = await connectMongo()
    mongoClient.
  }

}