const logger = require('../../utils/logger').logger(require('path').basename(__filename));

const gameDao = require('../game_dao')
const messages = require('../messages')
const RoundState = require('../game_state').RoundState
const deck = require('../deck')
const finishPlaceCardsHandler = require('./finish_place_cards_handler').finishPlaceCardsHandler

exports.autoFinishPlaceCardsHandler = (socket, io) => {
     return async (msg, Ack) => {
         logger.debug("finish place cards request: " + msg);
         let json = JSON.parse(msg)

         let userId = json.userId
         let roomNo = json.roomNo

         let cardsDict = await gameDao.getPlayerCards(roomNo)
         let cards = cardsDict[userId]
        
         let cardsResult = []
         cardsResult.push([
            cards[0], cards[1], cards[2]
         ])
         cardsResult.push([
            cards[3], cards[4], cards[5], cards[6], cards[7]
         ])
         cardsResult.push([
            cards[8], cards[9], cards[10], cards[11], cards[12],
         ])

         let reqObj = {
             userId: userId,
             roomNo: roomNo,
             specialCardType: '',
             cardsResult: cardsResult
         }
         
         await finishPlaceCardsHandler(socket, io)(JSON.stringify(reqObj), () => {})
     }
}