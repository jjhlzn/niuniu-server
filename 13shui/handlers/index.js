const handlers = {}

const messages =  require('../messages')
const joinRoomHandler = require('./join_room_handler').joinRoomHandler
const leaveRoomHandler = require('./leave_room_handler').leaveRoomHandler

module.exports = {
    registerMessageHandlers: function(io, socket) {
        socket.on(messages.JoinRoom, joinRoomHandler(socket, io))
        socket.on(messages.LeaveRoom, leaveRoomHandler(socket, io))
    }
}