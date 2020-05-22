const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const gameDao = require('../game_dao')
const messages = require('../messages')
const deck = require('../deck')
const userDao = require('../user_dao')
const RoundState = require('../game_state').RoundState

exports.finishPlaceCardsHandler = (socket, io) => {
     return async (msg, Ack) => {
         logger.debug("finish place cards request: " + msg);
         let json = JSON.parse(msg)

         let userId = json.userId
         let roomNo = json.roomNo
         let specialCardType = json.specialCardType
         let cardsResult = json.cardsResult

         //TODO: 检查参数和游戏的状态
         await gameDao.savePlaceCardsResult(userId, roomNo, specialCardType, cardsResult)
         Ack({status: 0})
         
         io.to(roomNo).emit(messages.SomeoneFinishPlaceCards, {userId: userId, roomNo: roomNo})

         //判断是否可以进行比牌了
         await checkAndSendCompareCardsNotify(roomNo, io)
     }
}


async function checkAndSendCompareCardsNotify(roomNo,  io) {
   //1. 检查是否所有人都已经发送了摆牌结束的消息
   let playerIds = await gameDao.getPlayerIds(roomNo);
   let placeCardsResult = await gameDao.getPlaceCardsResults(roomNo)

   let isEveryoneFinish = true
   playerIds.forEach(playerId => {
      if (!placeCardsResult[playerId]) {
         isEveryoneFinish = false
      }
   })

   if (!isEveryoneFinish) {
      logger.debug("not everyone finish place cards")
      return
   }

   //2. 如果是，服务器端进行比牌，并且把存储比牌的结果，
   let scoreResult = deck.compareCards(placeCardsResult)
   let totalScores = gameDao.getScores(roomNo)
   playerIds.forEach(playerId => {
      totalScores[playerId] += scoreResult[playerId]
   })

   gameDao.saveScores(totalScores)

   //3. 设置游戏状态
   let game = await gameDao.getGame(roomNo)
   game.currentRoundNo++
   game.roundState = RoundState.BeforeState;
   await gameDao.saveGame(game)

   //4. 通知客户端进行比牌，通知内容包括：每个人的摆拍结果，以及分数，分数以服务器端为准
   let compareResult = []
   playerIds.forEach(playerId => {
      let item = {
         playerId: playerId,
         cardsResult: placeCardsResult[playerId], 
                  //{specialCardType: "", cardsResult: [['','',''],['',''],['','']]}
         score: scoreResult[playerId]
      }
      compareResult.push(item)
   })
   logger.debug("send compare card notify")
   logger.debug(JSON.stringify(compareResult))
   io.to(roomNo).emit(messages.CompareCard, {result: compareResult})
}