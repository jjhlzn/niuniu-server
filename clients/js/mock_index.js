var socket = io();
var players = [undefined, undefined, undefined, undefined, undefined, undefined];
var game = {
};
var mySeat = -1;

var round = {
}

let roomNo = getParameterByName("roomNo", "123456");
let userId = getParameterByName("userId", "web111");

console.log("roomNo: " + roomNo + ", userId: " + userId);
let seatNos = ["A", "B", "C", "D", "E", "F"];

let joinRoomReq = {
  roomNo: roomNo,
  userId: userId
};

socket.emit("JoinRoom", joinRoomReq, (msg) => {
  onselect.log("join success");
});

$('#resetRoomButton').click( () => {
  mySeat = -1;
  socket.emit('ResetRoom', {
    roomNo: roomNo,
    userId: userId
  });
});

//座位点击处理
$('#seatDiv button').click( (event) => {
  if (mySeat != -1)
    return;
  //console.log(event.target.id);
  let seatIndex = event.target.id[4];
  console.log("seatNo: " + seatIndex);

  let seatReq = {
    roomNo: roomNo,
    seat: seatNos[seatIndex],
    userId: userId
  };

  socket.emit('SitDown', seatReq, (msg) => {
    mySeat = seatIndex;
    //$('#seatDiv').hide();
  });
});

$('#standUpButton').click( () => {
  if (mySeat == -1)
    return;
  let standUpReq = {
    roomNo: roomNo,
    userId: userId
  }
  socket.emit('StandUp', standUpReq, (msg) => {
    mySeat = -1;
  });
});

$('#robButton').click( () => {
  robClick(true);
});

$('#notRobButton').click( () => {
  robClick(false);
});

$('.betButton').click( (event) => {
  let betReq = {
    roomNo: roomNo,
    userId: userId,
    bet: parseInt($(event.target).text())
  };

  socket.emit('Bet', betReq, (msg) => {
    console.log("bet success");
  });
});

$('#showCardButton').click( ()=> {
  let showCardReq = {
    roomNo: roomNo,
    userId: userId
  };

  socket.emit('ShowCard', showCardReq, (msg) => {
    console.log('show card success');
  })
});

$('#readyButton').click( () => {
  let readyReq = {
    roomNo: roomNo,
    userId: userId
  };

  socket.emit('Ready', readyReq, (msg) => {
    console.log('ready success');
  })
});

//有玩家坐下的通知
socket.on('SomePlayerSitDown', (msg) => {
  console.log('SomePlayerSitDown:', msg);
  let seatIndex = getSeatIndex(msg.seat);
  if (players[seatIndex]) {
    return;
  }
  players[msg.seatIndex] = msg.userId;
});

socket.on('GoToFirstDeal', (msg)=> {
  console.log('GoToFirstDeal: ' + msg);
  round.cards = msg.cards;
  round.bets = msg.bets;
  $('#robBankerDiv').show();
});

socket.on('GoToChooseBanker', (msg) => {
  console.log('GoToChooseBanker: ' + msg);
});

function getSeatIndex(seatNo) {
  for(var i = 0; i < seatNos.length; i++) {
    if (seatNo == seatNos[i]) 
      return i;
  }
  throw new Error("座位号有问题");
  return -1;
}

function robClick(isRob) {
  let robReq = {
    roomNo: roomNo,
    userId: userId,
    isRob: isRob
  }
  socket.emit('RobBanker', robReq, (msg) => {
    console.log("has sent rob req sucess");
  });
}


function getParameterByName(name, defaultValue) {
  var url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return defaultValue;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}


