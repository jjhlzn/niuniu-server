let showCardHanlder = require('../show_card_handler');
const _ = require('underscore');

function testGetBiggerWinnersAndLosers1() {
  let scores = {
		"test1": -112,
    "test2": 64,
    "test3": -32,
    "test4": 136,
    "test5": -56
  };
  
  let result = showCardHanlder.getBiggerWinnersAndLosers(scores);

  console.log("result: " + JSON.stringify(result));
}

function testGetBiggerWinnersAndLosers2() {
  
}

testGetBiggerWinnersAndLosers1();