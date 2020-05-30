"use strict";

const _ = require('underscore');
const logger = require('../utils/logger').logger(require('path').basename(__filename));

function generateDeckCards() {
  let types = ['s', 'h', 'c', 'd'];
  let cardPoints = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'].reverse();
  let cards = [];
  cardPoints.forEach ( cardPoint => {
    types.forEach ( type => {
      cards.push(cardPoint + type);
    });
  });
  return cards;
}

function shuffle() {
  let a = generateDeckCards();
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal(game) {
  logger.debug("begin deal");
  let cards = shuffle();

  let playerCount = game.players.length
  let rs = []

  for(var i = 0; i < playerCount; i++) {
    let hand = []
    for(var j = 0; j < 13; j++) {
      hand.push(cards.pop())
    }
    rs.push(hand)
  }
  return rs;
}

/**
 * 13水比牌
 */
function compareCards(cardsResult) {
  let playerIds = _.keys(cardsResult)
  let scoreResults = {}
  playerIds.forEach(playerId => {
    scoreResults[playerId] = 0
  })
  return scoreResults
}

function compareCards1(result1, result2) {
  if (result1.specialCardType && result2.specialCardType) {
    var score = getSpecialCardTypeDaos(result1.specialCardType) 
            - getSpecialCardTypeDaos(result2.specialCardType)
    return [score, -score]
  }

  if (result1.specialCardType) {
    var score = getSpecialCardTypeDaos(result1.specialCardType)
    return [score, -score]
  }

  if (result2.specialCardType) {
    var score= getSpecialCardTypeDaos(result2.specialCardType)
    return [-score, score]
  }

  var score = 0
  for(var i = 0; i < 3; i++) {
    var score1 = compareDao(i, result1.cardsResult[i], result2.cardsResult[i])
    score += score1
  }
  return [score, -score]
}

function  getSpecialCardTypeDaos(specialCardType) {
  return 0
}

function compareDao(daoNo, cards1, cards) {
  return 0
}


module.exports = {
  deal: deal,
  compareCards: compareCards
}

/*
var game = { players: [1, 2, 3] }
let rs = deal(game)
rs.forEach(hand => console.log(hand) )
*/