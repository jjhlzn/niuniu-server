var socket = io();

function checkUserIdAndRoomNo() {
  if ($('#userId').val() == "" || $('#roomNo').val() == "") {
    return false
  }
  return true;
}

$(document).ready(function(){

  $('#setUserIdBtn').click(() => {
    userId = $('#userId').val()
    roomNo = $('#roomNo').val()
  })

  $('#joinBtn').click(() => {
    if (!checkUserIdAndRoomNo()) {
      alert('必须提供userId和房间号')
      return false;
    }

    let joinRoomReq = {
      roomNo: $('#roomNo').val(),
      userId:  $('#userId').val()
    };

    socket.emit("13_JoinRoom", JSON.stringify(joinRoomReq), (msg) => {
      console.log(msg);
    });

  })

  $('#leaveBtn').click(() => {
    if (!checkUserIdAndRoomNo()) {
      alert('必须提供userId和房间号')
      return false;
    }

    let leaveRoomReq = {
      roomNo: $('#roomNo').val(),
      userId:  $('#userId').val()
    }

    socket.emit("13_LeaveRoom", JSON.stringify(leaveRoomReq), (msg) => {
      console.log(msg)
    })

  })

  $('#readyBtn').click(() => {
    if (!checkUserIdAndRoomNo()) {
      alert('必须提供userId和房间号')
      return false;
    }

    let readyReq = {
      roomNo: $('#roomNo').val(),
      userId:  $('#userId').val()
    }

    socket.emit("13_Ready", JSON.stringify(readyReq), (msg) => {
      console.log(msg)
    })
  })

  $('#startBtn').click(() => {
    if (!checkUserIdAndRoomNo()) {
      alert('必须提供userId和房间号')
      return false;
    }

    let startReq = {
      roomNo: $('#roomNo').val(),
      userId:  $('#userId').val()
    }

    socket.emit("13_StartGame", JSON.stringify(startReq), (msg) => {
      console.log(msg)
    })
  })

  $('#finishPlaceBtn').click(() => {
    if (!checkUserIdAndRoomNo()) {
      alert('必须提供userId和房间号')
      return false;
    }

    let startReq = {
      roomNo: $('#roomNo').val(),
      userId:  $('#userId').val()
    }

    socket.emit("13_AutoPlaceCards", JSON.stringify(startReq), (msg) => {
      console.log(msg)
    })
  })



  //set default
  $('#userId').val('test2')
  $('#roomNo').val('346614')


})