var userId = "", roomNo = ""
var socket = io();

function checkUserIdAndRoomNo() {
  if (userId == "" || roomNo == "") {
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
      roomNo: roomNo,
      userId: userId
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
      roomNo: roomNo,
      userId: userId
    }

    socket.emit("13_LeaveRoom", JSON.stringify(leaveRoomReq), (msg) => {
      console.log(msg)
    })

  })

})