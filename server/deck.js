

"use strict";

const _ = require('underscore');
var path = require('path');
const logger = require('./utils/logger').logger(path.basename(__filename));


let cardsOfDeck = [];
cardsOfDeck = generateDeckCards();
let cardsDict = {};
for(var i = 0; i < cardsOfDeck.length; i++) {
  cardsDict[cardsOfDeck[i]] = cardsOfDeck.length - i;
}

function generateDeckCards() {

  let types = ['spades', 'hearts', 'clubs', 'diamonds'];
  let cardPoints = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'].reverse();

  let cards = [];
  
  cardPoints.forEach ( cardPoint => {
    types.forEach ( type => {
      cards.push(type + '_' + cardPoint);
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

function getCardPoint(card) {
  let pointStr = card.substr(card.indexOf('_') + 1);
  let point = parseInt(pointStr);
  if (!point) {
    if (pointStr == 'ace'){
      point = 1;
    } else {
      point = 10;
    }
  }
  return point;
}

//TODO: 根据牌的情况，计算出牛几，和牌的排列顺序，倍数
let cardsGroup = [ 
  {a: [0, 1, 2], b: [3 ,4], c: [0, 1, 2, 3, 4]},
  {a: [0, 1, 3], b: [2 ,4], c: [0, 1, 3, 2, 4]},
  {a: [0, 1, 4], b: [2 ,3], c: [0, 1, 3, 4, 2]},
  {a: [0, 2, 3], b: [1 ,4], c: [0, 3, 1, 2, 4]},
  {a: [0, 2, 4], b: [1 ,3], c: [0, 3, 1, 4, 2]},
  {a: [0, 3, 4], b: [1 ,2], c: [0, 3, 4, 1, 2]},
  {a: [1, 2, 3], b: [0 ,4], c: [3, 0, 1, 2, 4]},
  {a: [1, 2, 4], b: [0 ,3], c: [3, 0, 1, 4, 2]},
  {a: [1, 3, 4], b: [0 ,2], c: [3, 0, 4, 1, 2]},
  {a: [2, 3, 4], b: [0 ,1], c: [3, 4, 0, 1, 2]},
]
function niu(game, cards) {
  let hasNiu = false;
  let cardSequences = [0, 1, 2, 3, 4];
  let niu = 0;
  let multiple = 1;
  for(var i = 0; i < cardsGroup.length; i++) {
    let a = cardsGroup[i].a, b = cardsGroup[i].b;
    let point1 = getCardPoint(cards[a[0]]), point2 = getCardPoint(cards[a[1]]), point3 = getCardPoint(cards[a[2]]);
    let point4 = getCardPoint(cards[b[0]]), point5 = getCardPoint(cards[b[1]]);
    if ((point1 + point2 + point3) % 10 == 0) {
      hasNiu = true;
      cardSequences  = cardsGroup[i].c;
      niu = (point4 + point5) % 10;
      if (niu == 0)
        niu = 10;
      switch(niu) {
        case 7:
          multiple = 2;
          break;
        case 8:
          multiple = 3;
          break;
        case 9:
          multiple = 4;
          break;
        case 10:
          multiple = 5;
          break;
        default:
          multiple = 1;
          break;
      }
      //跳出循环
      break;
    }
  }
  return {
    niu: niu,
    cardSequences: cardSequences,
    multiple: multiple
  };
}

function deal(game) {
  logger.debug("begin deal");
  let cards = shuffle();
  let round = game.rounds[game.rounds.length - 1];
  
  let players = _.keys(game.sitdownPlayers);
  logger.debug("game.sitdownPlayers: " + JSON.stringify(game.sitdownPlayers));
  let returnObj = {};
  players.forEach( (player, i) => {
    let myCards = [cards[i * 5 + 0], cards[i * 5 +1], 
          cards[i * 5 +2], cards[i * 5 +3], cards[i * 5 +4]];
    let myBets = [4, 6, 8]; //TODO: 根据上局结果和上句的压注，庄家计算
    let result = niu(game, myCards); 
    let playerDict = {
      robBanker: -1,
      bet: 0,
      cards: myCards,
      bets: myBets,
      niu: result.niu,
      cardSequences: result.cardSequences,
      multiple: result.multiple,
      winOrLoss: 0
    };
    round['players'][player] = playerDict;
  });
  logger.debug("end deal");
  return returnObj;
}

function compare(card1, card2) {
  var card1Value = cardsDict[card1], card2Value = cardsDict[card2];
  if (card1Value > card2Value) {
    return 1;
  }  else if (card1Value < card2Value) {
    return -1;
  } else {
    return 0
  }
}

module.exports = {
  deal: deal,
  compare: compare
}