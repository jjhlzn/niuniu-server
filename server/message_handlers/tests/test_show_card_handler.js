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

/*
  let a = [], b = [];
  for(var i = 0; i < 10000000; i++) {
    a.push(i);
    b.push(i);
  }
  result = [];
  result = _.zip(a, b).filter( item =>  item[0] % 2 == 0).map(item => item[0] + 1) ;
  console.log("result.length = " + result.length); */
}

function testGetBiggerWinnersAndLosers2() {
  
}

testGetBiggerWinnersAndLosers1();