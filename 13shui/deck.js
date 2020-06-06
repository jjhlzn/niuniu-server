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
  var scoreMatrix = []
  for(var i = 0; i < playerIds.length; i++) {
    var score = []
    for(var j = 0; j < playerIds.length; j++) {
      score.push({score: 0, isAllWin: false, isAllLose: false})
    }
    scoreMatrix.push(score)
  } 

  for(var i = 0; i < playerIds.length; i++) {
    for(var j = i + 1; j < playerIds.length; j++) {
      var result1 = cardsResult[playerIds[i]]
      var result2 = cardsResult[playerIds[j]]
      compareCards1(result1, result2)
    }
  }
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
    return {score: score, isAllWin: false, isAllLose: false}
  }

  if (result1.specialCardType) {
    var score = getSpecialCardTypeDaos(result1.specialCardType)
    return{score: score, isAllWin: false, isAllLose: false}
  }

  if (result2.specialCardType) {
    var score= getSpecialCardTypeDaos(result2.specialCardType)
    return {score: -score, isAllWin: false, isAllLose: false}
  }

  var score = 0
  var winDaos = 0
  for(var i = 0; i < 3; i++) {
    var score1 = compareDao(i, result1.cardsResult[i], result2.cardsResult[i])
    if (score1 > 0) {
      winDaos++
    }
    score += score1
  }
  return {score: score, isAllWin: winDaos == 3, isAllLose: winDaos == 0}
}

/*
public static string SPECIAL_FLUSH = "special_flush"; //三同花
public static string SPECIAL_STRAIGHT = "special_straight"; //三顺子
public static string SPECIAL_PAIR = "special_pair";    //6对半
public static string SPECIAL_PAIR_WITH_THREE = "special_pair_with_three"; //5对冲3
public static string SPECIAL_LONG_STRAIGHT = "special_long_straight"; //一条龙
public static string SPECIAL_TRIPLE = "special_three"; //4个3条
public static string SPECIAL_ALL_THE_SAME_COLOR = "special_all_the_same_color"; 
*/
function  getSpecialCardTypeDaos(specialCardType) {
  //TODO: 检查是不是特殊牌型
  switch (specialCardType) {
    case 'special_flush':
    case 'special_straight':
    case 'special_pair':
      return 6;
    case 'special_pair_with_three':
      return 9;
    case 'special_long_straight':
      return 26;
    case 'special_three':
      return 32;
    case 'special_all_the_same_color':
      return 26
  }
  throw 'not supported special card type: ' + specialCardType
}

function compareDao(daoNo, cards1, cards2) {
  var cardType1 = getCardType(cards1)
  var cardType2 = getCardType(cards2)
  return cardType1.compare(daoNo, cardType2) 
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