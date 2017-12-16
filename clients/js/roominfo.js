function getSuit(value) {
  return value.substr(0, value.indexOf('_'));
}

function getPoint(value) {
  return value.substr(value.indexOf('_') + 1);
}

function getSpace(number) {
  let result = ""
  for(var i= 0; i < number; i++) {
    result += "&nbsp;"
  }
  return result;
}

function getNumberString(value) {
  if (value > 0) {
    return "+" + value;
  }
  return value + "";
}

function getStateString(state) {
  if (state == "RobBanker") {
    return "抢庄";
  } 
  if (state == "BeforeStart") {
    return "未开始";
  } 
  if (state == "Bet") {
    return "下注";
  } 
  if (state == "CheckCard") {
    return "比牌";
  } 
  if (state == "WaitForNextRound") {
    return "等待下一局";
  } 
  return state;

}

function makeAPlayerDiv(round, player, containerDiv) {
  let playerId = player.userId;
  let nameDiv = $('<div>').append($('<p>', {html: player.nickname}));
  let idDiv = $('<div>').append($('<p>', {html: 'ID: ' + player.userId}));
  let betInfo = "";
  console.log("banker: " + round.banker); 
  if (playerId == round.banker) {
    betInfo = "庄家";
  } else {
    betInfo = '下注: ' + round.playerBets[playerId];
  }
  let betDiv = $('<div>').append($('<p>', {html: betInfo, class: playerId == round.banker ? "banker bet" : "bet"}));
  let userInfo2Div = $('<div>', {class: 'col col-md-7 userInfo2'})
                    .append(nameDiv)
                    .append(idDiv)
                    .append(betDiv);

  let userImageDiv = $('<div>', {class: 'col col-md-4'})
                      .append($('<img>', {class: 'userImage', src: player.headimgurl}));
  let userInfoDiv = $('<div>', {class: 'row userInfo'}).append( userImageDiv).append(userInfo2Div);

  let cardsDiv = $('<div>', {class: 'cards'});
  let cards = round.playerCardsDict[playerId];
  cards.forEach( (card, index) => {
    let cardDiv = $('<div>', {class: 'card card' + (index + 1)})
    .append( Poker.getCardImage(50, getSuit(card), getPoint(card)));
    cardsDiv.append(cardDiv);
  });
  cardsDiv.append($('<div>', {class: 'niu',}).append($('<img>', {class: 'niuImage', src: './images/niu_images/niu' + round.niuArray[playerId]+'.png'})))

  let score = round.resultDict[playerId];
  let scoreDiv = $('<div>').append($('<p>', {class: 'score ' + (score >= 0 ? 'score_win' : 'score_loss')}).html(getNumberString(round.resultDict[player.userId])));

  let playerDiv = $('<div>', {class: 'col col-lg-2 playerContainer'});
  playerDiv.append(userInfoDiv).append(cardsDiv).append(scoreDiv);

  playerDiv.appendTo(containerDiv);
}

function makeARoundDiv(round, index) {

  let roundDiv = $('<div>', {class: 'roundDiv col col-lg-12'});

  let roundInfo = "第" + index + "局   " + getSpace(4) + round.startTime + getSpace(4) +  "  状态：" + getStateString(round.state);
  let roundInfoDiv = $('<div>', {class: 'row'})
        .append($('<p>', {class: 'roundInfo col col-lg-12', html: roundInfo}));

  let roundContainerDiv = $('<div>', {class: 'row'});
  
  round.players.forEach( player => {
    makeAPlayerDiv(round, player, roundContainerDiv);
  });

   roundDiv.append(roundInfoDiv).append(roundContainerDiv).appendTo('#roundsDiv');
}

function fetchGameInfo(roomNo) {
  var jqxhr = $.post( "/getgameinfo", {roomNo: roomNo}, function() {
    console.log( "success" );
  })
    .done(function(msg) {
      //console.log("msg: " + msg);
      let resp = JSON.parse(msg);
      if (resp.status != 0) {
        alert(resp.errorMessage);
      } else {
        let rounds = resp.rounds.reverse();
        rounds.forEach((round, index) => {
          if (index == 0) {
            round.state = game.state;
          } else {
            round.state = "已结束";
          }
          makeARoundDiv(round, rounds.length - index);
        });
      }
      console.log( "second success" );
    })
    .fail(function() {
      console.log( "error" );
      alert("获取服务器数据时失败！");
    })
    .always(function() {
      //console.log( "complete" );
    });
}

$(() => {
  $('#roomInfoPart1').html("房间号: "+game.roomNo+ getSpace(4) + "房主:  "+game.creater
      + getSpace(4) +  "抢庄：名牌抢庄"+ getSpace(4)+"分数：【4，6，8分】");
  $('#roomInfoPart2').html(game.createTime);
 
  $('.roundDiv').remove();

  fetchGameInfo("123456");

  
});