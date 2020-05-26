const handlers = {}

const messages =  require('../messages')
const joinRoomHandler = require('./join_room_handler').joinRoomHandler
const leaveRoomHandler = require('./leave_room_handler').leaveRoomHandler
const readyHandler = require('./ready_handler').readyHandler
const startGameHandler = require('./start_game_handler').startGameHandler
const autoPlaceCardsHandler = require('./auto_finish_place_cards_handler').autoFinishPlaceCardsHandler
const placeCardsHandler = require('./finish_place_cards_handler').finishPlaceCardsHandler
const dismissRoomHandler = require('./dismiss_room_handler').dismissRoomHandler

module.exports = {
    registerMessageHandlers: function(io, socket) { 
        socket.on(messages.JoinRoom, joinRoomHandler(socket, io))
        socket.on(messages.LeaveRoom, leaveRoomHandler(socket, io))
        socket.on(messages.Ready, readyHandler(socket, io))
        socket.on(messages.StartGame, startGameHandler(socket, io))
        socket.on(messages.AutoPlaceCards, autoPlaceCardsHandler(socket, io))
        socket.on(messages.FinishPlaceCards, placeCardsHandler(socket, io))
        socket.on(messages.DismissRoom, dismissRoomHandler(socket, io))
    }
} 