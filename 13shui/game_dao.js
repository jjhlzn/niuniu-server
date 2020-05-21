
const _ = require('underscore');

var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const connectRedis = require('../db2/redis_connect').connect;
const userDao =  require('./user_dao')
const gameUtils = require('../db/game_utils');

//获取房间中的玩家userId列表
async function getPlayerIds(roomNo) {
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

//获取房间的所有玩家的信息列表和位置的对应关系，不仅仅是userId
async function getPlayerSeatDict(roomNo) {
  var client = connectRedis()
  var hash = await client.hgetallAsync(gameUtils.sitdownPlayersKey(roomNo))
  //logger.debug(hash)
  if (!hash) {
    return {}
  }
  return hash
}

//获取房间的基本信息
async function getGame(roomNo) {
  let redisClient = await connectRedis();
  let res = await redisClient.getAsync(gameUtils.gameKey(roomNo))
  if (!res) {
    return null;
  }
  return JSON.parse(res);
}

//获取房间空的位置号列表
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

//设置用户已经准备
async function ready(roomNo, userId) {
  await connectRedis().hsetAsync(gameUtils.readyPlayersKey(roomNo), userId, "")
}

//设置用户在线
async function offline(roomNo, userId) {
  await connectRedis().hsetAsync(gameUtils.offlinePlayersKey(roomNo), userId, "")
}

//设置用户离线
async function online(roomNo, userId) {
  await connectRedis().hdelAsync(gameUtils.offlinePlayersKey(roomNo), userId, "")
}

//设置用户已经摆牌结束，将这些信息存储到redis
async function  finishPlaceCards(roomNo, userId, cardsArray, specialCardType) {
  throw 'not implemented'
}

//获取房间已经ready的用户userId列表
async function getReadyUsers(roomNo) {
  const client = connectRedis()
  let hash = await client.hgetallAsync(gameUtils.readyPlayersKey(roomNo))
  if (!hash) {
    return []
  }
  return _.keys(hash)
}

//房间的人是否所有人都已经准备
async function isAllUsersReady(roomNo) {
  throw 'not implemented'
}

//获取房间所有离线的用户列表
async function getOfflineUsers(roomNo) {
  const client = connectRedis()
  let hash = await client.hgetallAsync(gameUtils.offlinePlayersKey(roomNo))
  if (!hash) {
    return []
  }
  return _.keys(hash)
}

//是否所有人都在线
async function isAllUsersOnline(roomNo) {
  throw 'not implemented'
}


module.exports = {
  getPlayerIds: getPlayerIds,
  getGame: getGame,
  getEmptySeats: getEmptySeats,
  removeGameOnlyRedis: removeGameOnlyRedis,
  getPlayerSeatDict: getPlayerSeatDict,
  online: online,
  offline: offline,
  ready: ready,
  getReadyUsers: getReadyUsers,
  getOfflineUsers: getOfflineUsers,
}

function generateSeatNos(cnt) {
  if (cnt == 4) {
    return ['A', 'B', 'C', 'D']
  }
  return []
}