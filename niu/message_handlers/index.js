const handlers = {};

const messages = require('../messages');

const joinRoomHandler = require('./join_room_handler').joinRoomHandler;
handlers['joinRoomHandler'] = joinRoomHandler;

const sitDownHandler = require('./sitdown_handler').sitdownHandler;
handlers['sitDownHandler'] = sitDownHandler;

const standupHandler = require('./standup_handler').standupHandler;
handlers['standupHandler'] = standupHandler;

const readyHandler = require('./ready_handler').readyHandler;
handlers['readyHandler'] = readyHandler;
const createReadyTimer = require('./ready_handler').createReadyTimer;
handlers['createReadyTimer'] = createReadyTimer;

const startGameHandler = require('./start_game_handler').startGameHandler;
handlers['startGameHandler'] = startGameHandler;

const resetRoomHandler = require('./reset_room_handler').resetRoomHandler;
handlers['resetRoomHandler'] = resetRoomHandler;

const robBankerHandler = require('./rob_banker_handler').robBankerHandler;
handlers['robBankerHandler'] = robBankerHandler;
const createRobBankerTimer = require('./rob_banker_handler').createRobBankerTimer;
handlers['createRobBankerTimer'] = createRobBankerTimer;

const betHandler = require('./bet_handler').betHandler;
handlers['betHandler'] = betHandler;
const createBetTimer = require('./bet_handler').createBetTimer;
handlers['createBetTimer'] = createBetTimer;

const showcardHandler = require('./show_card_handler').showcardHandler;
handlers['showcardHandler'] = showcardHandler;
const createShowcardTimer = require('./show_card_handler').createShowcardTimer;
handlers['createShowcardTimer'] = createShowcardTimer;

const dismissRoomHanler = require('./dismiss_room_handler').dismissRoomHanler;
handlers['dismissRoomHanler'] = dismissRoomHanler;

const leaveRoomHandler = require('./leave_room_handler').leaveRoomHandler;
handlers['leaveRoomHandler'] = leaveRoomHandler;

const handleUserDelegate = require('./delegate_handler').handleUserDelegate;
const delegateHandler = require('./delegate_handler').delegateHandler;
handlers['delegateHandler'] = delegateHandler;

const handleUserNotDelegate = require('./not_delegate_handler').handleUserNotDelegate;
const notDelegateHandler = require('./not_delegate_handler').notDelegateHandler;
handlers['notDelegateHandler'] = notDelegateHandler;

const offlineHanlder13 = require('../../13shui/handlers/offline_handler').offlineHandler

var path = require('path');
const logger = require('../../utils/logger').logger(path.basename(__filename)); 

function registerMessageHandlers(io, socket) {
    socket.on(messages.JoinRoom, joinRoomHandler(socket, io));
    socket.on(messages.DismissRoom, dismissRoomHanler(socket, io));
    socket.on(messages.LeaveRoom, leaveRoomHandler(socket, io));
    socket.on(messages.SitDown, sitDownHandler(socket, io));
    socket.on(messages.StartGame, startGameHandler(socket, io, handlers));
    socket.on(messages.ResetRoom, resetRoomHandler(socket, io));
    socket.on(messages.StandUp, standupHandler(socket, io));
    socket.on(messages.RobBanker, robBankerHandler(socket, io, handlers));
    socket.on(messages.Bet, betHandler(socket, io, handlers));
    socket.on(messages.ShowCard, showcardHandler(socket, io, handlers));
    socket.on(messages.Ready, readyHandler(socket, io, handlers));
    socket.on(messages.Delegate, delegateHandler(socket, io));
    socket.on(messages.NotDelegate, notDelegateHandler(socket, io));

    socket.on('disconnect', () => {
        logger.debug("handle disconnect");

        if (socket.roomNo && socket.userId && socket.gameType == 'thirteenshui') {
          offlineHanlder13(io,socket.roomNo, socket.userId)
        } else if (socket.roomNo && socket.userId) {
          handleUserDelegate(io, socket.roomNo, socket.userId)
        }
          
    });
}

module.exports = {
    registerMessageHandlers: registerMessageHandlers
  }