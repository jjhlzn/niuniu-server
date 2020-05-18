
let deck = require('./deck');
 
//console.log(deck.shuffle())
let cards = deck.cards;

const express = require('express');
const app = express();
var http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('./clients'));
app.use(express.static('node_modules'));

http.listen(3000);

var players = [];
var playerShowCardDict = {};
var playerReadyDict = {};
let isUseTimeout = true;
let stateTimoutSeconds = 6000;

function handler (req, res) {
  fs.readFile(__dirname + '/clients/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}


io.on('connection', function (socket) {
  console.log('Hello, 13水客户端');
  /***********************************************************************************/
  socket.on("ResetRoom", (msg, ack) => {
    console.log("ResetRoom: " + JSON.stringify(msg));
    players = [];
    playerRobDict = {};
    playerBetDict = {};
    playerShowCardDict = {};
    banker = "";
  });

  /***********************************************************************************/
  socket.on("JoinRoom", (msg, Ack) => {
    console.log("JoinRoom: " + JSON.stringify(msg));
    let roomNo = msg.roomNo;
    socket.join(roomNo);
  });

  /***********************************************************************************/
  socket.on("LeaveRoom", (msg, Ack) => {
    console.log("LeaveRoom: " + msg);
    let roomNo = msg.roomNo;
    socket.leave(roomNo);
  });

  /***********************************************************************************/
  socket.on("StartGame", (msg, Ack) => {
    console.log("StartGame: " + JSON.stringify(msg));
    Ack({"status": 0, "errorMessage": "no error "});

    let cardsDict = {};
    let betsDict = {};
    players.forEach ( (player, i) => {
      cardsDict[player] = [ cards[i * 4 + 0], cards[i * 4 + 1], cards[i * 4 + 2], cards[i * 4 + 3] ]; 
      betsDict[player] = [4, 6, 8];
    });

    let resp = {
      "status" : 0,
      "errorMessage": "",
      "roomNo" : msg.roomNo,   //游戏房间
      "cardsDict": cardsDict,    //游戏中成员所有人的牌
      "betsDict": betsDict,  //可以押注的点数   
    }

    io.to(msg.roomNo).emit("StartGame", resp);

    let roomNo = msg.roomNo;
    if (isUseTimeout) {
      setTimeout( ()=> {
        //检查是否所有人都已经抢庄了，如果没有，发送默认的处理，进入下一状态。
        let isAllRob = true;
        players.forEach( player => {
          isAllRob = isAllRob && playerRobDict.hasOwnProperty(player);
          if (!playerRobDict.hasOwnProperty(player)) {
            io.to(roomNo).emit("SomePlayerRobRanker", {
              roomNo: roomNo,
              userId: player,
              isRob: false
            });
            console.log("timeout, sent RobBankerNotiy");
          } else {
            console.log(player + " has robbed banker");
          }
        });

        if (!isAllRob) {
          console.log("timeout, sent GoToChooseBankerNotify");
          sendGoToChooseBankerNotify(msg.userId, roomNo);
        }
      }, stateTimoutSeconds + firstDealAnimationTime);
    }

  });

  socket.on("Ready", (msg, Ack) => {
    var playerRobDict = {};
    var playerBetDict = {};
    var playerShowCardDict = {};
    
    playerReadyDict[msg.userId] = true;
    console.log("Ready: " + JSON.stringify(msg));
    Ack({"status": 0, "errorMessage": "no error "});

    io.to(msg.roomNo).emit("SomePlayerReady", msg);

    //检查是否所有人都已经准备，如果是，则通知所有人进入下一句
    var isAllReady = true;
    players.forEach( player => {
      isAllReady = isAllReady && playerReadyDict.hasOwnProperty(player);
    });

    console.log("players = " + players);
    console.log("isAllReady = " + isAllReady);
    
    if (isAllReady) {
      sendGoToFirstDealNotify(msg.roomNo);

      
    }
  });


  /***********************************************************************************/
  function sendCompareCardRequest(roomNo) {
    playerShowCardDict = {};
    let resultDict = {};
    players.forEach ( (player, i) => {
      if (player != banker) {
        resultDict[player] = 10;
      }
    });

    let notify = {
      roomNo: roomNo,
      resultDict: resultDict
    };

    playerRobDict = {};
    playerBetDict = {};
    playerShowCardDict = {};
    playerReadyDict = {};
    banker = "";
    io.to(roomNo).emit("GoToCompareCard", notify)
  }

  function sendShowCardRequest(roomNo, userId) {
    let a = parseInt(Math.random(0, 1) * 1000000) % 52;
    let b = parseInt(Math.random(0, 1) * 1000000) % 52;
    let c = parseInt(Math.random(0, 1) * 1000000) % 52;
    let d = parseInt(Math.random(0, 1) * 1000000) % 52;
    let e = parseInt(Math.random(0, 1) * 1000000) % 52;
    io.to(roomNo).emit('SomePlayerShowCard', {
      roomNo: roomNo,
      userId: userId,
      cards: [cards[a], cards[b], cards[c], cards[d], cards[e]],
      niu: 5,
      cardSequences: [0, 1, 4, 2, 3],
      multiple: 1
    });
  }

  socket.on("ShowCard", (msg, Ack) => {
    console.log('ShowCard: ' + JSON.stringify(msg));
    playerShowCardDict[msg.userId] = true;
    Ack({
      niu: 5,
      cardSequences: [0, 1, 4, 2, 3],
      multiple: 1
    });

    sendShowCardRequest(msg.roomNo, msg.userId);

    var isAllShowCard = true;
    players.forEach( player => {
      if (!playerShowCardDict.hasOwnProperty(player)) {
        console.log(player + " haven't showcard");
      }
      isAllShowCard = isAllShowCard && playerShowCardDict.hasOwnProperty(player);
    });

    console.log("players = " + players);
    console.log("playerShowCardDict = " + playerShowCardDict);
    console.log("isAllShowCard = " + isAllShowCard); 
    
    if (isAllShowCard) {
      sendCompareCardRequest(roomNo);
      //TODO 下一局准备定时器，一旦定时器触发，就默认准备好，并且进入下一个状态。
    }
  });
  /***********************************************************************************/
});