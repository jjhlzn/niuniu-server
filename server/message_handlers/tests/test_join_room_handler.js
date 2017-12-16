const handlerCreater = require('../join_room_handler').joinRoomHandler;

let socket = {};
socket.join = () => {};

let io = {};
io.to = () => {
  let result = {};
  result.emit = () => {};
  return result;
}

let handler = handlerCreater(socket, io);

let msg = {
  roomNo: '123456',
  userId: '7654321'
}
handler(JSON.stringify(msg));