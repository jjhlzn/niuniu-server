const handlers = {};

const joinRoomHandler = require('./server/message_handlers/join_room_handler').joinRoomHandler;
handlers['joinRoomHandler'] = joinRoomHandler;

const sitDownHandler = require('./server/message_handlers/sitdown_handler').sitdownHandler;
handlers['sitDownHandler'] = sitDownHandler;

const standupHandler = require('./server/message_handlers/standup_handler').standupHandler;
handlers['standupHandler'] = standupHandler;

const readyHandler = require('./server/message_handlers/ready_handler').readyHandler;
handlers['readyHandler'] = readyHandler;
const createReadyTimer = require('./server/message_handlers/ready_handler').createReadyTimer;
handlers['createReadyTimer'] = createReadyTimer;

const startGameHandler = require('./server/message_handlers/start_game_handler').startGameHandler;
handlers['startGameHandler'] = startGameHandler;

const resetRoomHandler = require('./server/message_handlers/reset_room_handler').resetRoomHandler;
handlers['resetRoomHandler'] = resetRoomHandler;

const robBankerHandler = require('./server/message_handlers/rob_banker_handler').robBankerHandler;
handlers['robBankerHandler'] = robBankerHandler;
const createRobBankerTimer = require('./server/message_handlers/rob_banker_handler').createRobBankerTimer;
handlers['createRobBankerTimer'] = createRobBankerTimer;

const betHandler = require('./server/message_handlers/bet_handler').betHandler;
handlers['betHandler'] = betHandler;
const createBetTimer = require('./server/message_handlers/bet_handler').createBetTimer;
handlers['createBetTimer'] = createBetTimer;

const showcardHandler = require('./server/message_handlers/show_card_handler').showcardHandler;
handlers['showcardHandler'] = showcardHandler;
const createShowcardTimer = require('./server/message_handlers/show_card_handler').createShowcardTimer;
handlers['createShowcardTimer'] = createShowcardTimer;

const dismissRoomHanler = require('./server/message_handlers/dismiss_room_handler').dismissRoomHanler;
handlers['dismissRoomHanler'] = dismissRoomHanler;

const leaveRoomHandler = require('./server/message_handlers/leave_room_handler').leaveRoomHandler;
handlers['leaveRoomHandler'] = leaveRoomHandler;

const handleUserDelegate = require('./server/message_handlers/delegate_handler').handleUserDelegate;
const delegateHandler = require('./server/message_handlers/delegate_handler').delegateHandler;
handlers['delegateHandler'] = delegateHandler;

const handleUserNotDelegate = require('./server/message_handlers/not_delegate_handler').handleUserNotDelegate;
const notDelegateHandler = require('./server/message_handlers/not_delegate_handler').notDelegateHandler;
handlers['notDelegateHandler'] = notDelegateHandler;

const checkuserInGameHandle = require('./server/http_handlers/check_user_in_game_handler').handle;
const createRoomHandle = require('./server/http_handlers/create_room_handler').handle;
const getRoomHandle = require('./server/http_handlers/get_room_handler').handle;
const loginHandle = require('./server/http_handlers/login_handler').handle;
const shareHandle = require('./server/http_handlers/share_handler').handle;

const messages = require('./server/messages');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var http = require('http').Server(app);
const io = require('socket.io')(http);

var path = require('path');
const logger = require('./server/utils/logger').logger(path.basename(__filename));

//logger.debug("readyHandler = " + readyHandler)

app.use('/share', shareHandle);
app.use('/checkuseringame', checkuserInGameHandle);
app.use('/createroom', createRoomHandle);
app.use('/getroom', getRoomHandle);
app.use('/login', loginHandle);
app.use(express.static('./clients'));
app.use(express.static('./clients/images'));
app.use(express.static('node_modules'));

http.listen(3001);

io.on('connection', socket => {
  
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

  //连接中断，如果需要处理委托
  socket.on('disconnect', () => {
    if (socket.roomNo && socket.userId)
      handleUserDelegate(io, socket.roomNo, socket.userId)
  });
});

