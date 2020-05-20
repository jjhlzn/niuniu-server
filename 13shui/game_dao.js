
const _ = require('underscore');

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const connectRedis = require('../db2/redis_connect').connect;
const connectMongo = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;
const userDao =  require('./user_dao')
const gameUtils = require('../db/game_utils');

async function getSitPlayerIds(roomNo) {
  var client = connectRedis()
  var hash = await client.hgetallAsync(gameUtils.sitdownPlayersKey(roomNo))
  console.log(hash)
  var sitdownPlayers = []
  if (!hash) {
    sitdownPlayers = []
  } else {
    sitdownPlayers = _.keys(hash)
  }
  return sitdownPlayers
}

async function getSitdownPlayerHash(roomNo) {
  var client = connectRedis()
  var hash = await client.hgetallAsync(gameUtils.sitdownPlayersKey(roomNo))
  //logger.debug(hash)
  if (!hash) {
    return {}
  }
  var userIds = _.keys(hash)
  var result = {}

  for(var i = 0; i < userIds.length; i++) {
    var userId = userIds[i]
    result[hash[userId]] = await userDao.getUser(userId)
  }
  return result
}

async function getGame(roomNo) {
  let redisClient = await connectRedis();
  let res = await redisClient.getAsync(gameUtils.gameKey(roomNo))
  if (!res) {
    return null;
  }
  return JSON.parse(res);
}

async function loadSitdownPlayerIds(game) {
  //加载在房间中的玩家
  game.players = await getSitPlayerIds(game.roomNo)
}

async function getEmptySeats(game) {
  var client = connectRedis()
  var hash = await client.hgetallAsync(gameUtils.sitdownPlayersKey(game.roomNo))
  var hasPersonSeatNos = []
  if (!hash) {
    hasPersonSeatNos = []
  } else {
    hasPersonSeatNos = _.values(hash)
  }
  var allSeatNos = generateSeatNos(game.maxPlayers)
  return _.difference(allSeatNos, hasPersonSeatNos)
}

async function removeGameOnlyRedis(roomNo) {
  var client = await connectRedis()
  await client.delAsync(gameUtils.gameKey(roomNo))
}

module.exports = {
  getSitPlayerIds: getSitPlayerIds,
  getGame: getGame,
  loadSitdownPlayerIds: loadSitdownPlayerIds,
  getEmptySeats: getEmptySeats,
  removeGameOnlyRedis: removeGameOnlyRedis,
  getSitdownPlayerHash: getSitdownPlayerHash
}

function generateSeatNos(cnt) {
  if (cnt == 4) {
    return ['A', 'B', 'C', 'D']
  }
  return []
}