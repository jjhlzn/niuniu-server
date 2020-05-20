const handlers = {}

const messages =  require('../messages')
const joinRoomHandler = require('./join_room_handler').joinRoomHandler
handlers[messages.JoinRoom] = joinRoomHandler

module.exports = {
    registerMessageHandlers: function(io, socket) {
        socket.on(messages.JoinRoom, joinRoomHandler(socket, io))
    }
}