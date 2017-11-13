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



const messages = require('./server/messages');
const express = require('express');
const app = express();
var http = require('http').Server(app);
const io = require('socket.io')(http);

var path = require('path');
const logger = require('./server/utils/logger').logger(path.basename(__filename));

//logger.debug("readyHandler = " + readyHandler)

app.use(express.static('./clients'));
app.use(express.static('node_modules'));

http.listen(8000);

function handler (req, res) {
 fs.readFile(__dirname + '/clients/index.html',
 function (err, data) {
   if (err) {
     res.writeHead(500);
     return res.end('Error loading index.html');
   }

   res.writeHead(200);
   res.end(data);
 });
}

io.on('connection', socket => {
  socket.on(messages.JoinRoom, joinRoomHandler(socket, io));
  socket.on(messages.SitDown, sitDownHandler(socket, io));
  socket.on(messages.StartGame, startGameHandler(socket, io, handlers));
  socket.on(messages.ResetRoom, resetRoomHandler(socket, io));
  socket.on(messages.StandUp, standupHandler(socket, io));
  socket.on(messages.RobBanker, robBankerHandler(socket, io, handlers));
  socket.on(messages.Bet, betHandler(socket, io, handlers));
  socket.on(messages.ShowCard, showcardHandler(socket, io, handlers));
  socket.on(messages.Ready, readyHandler(socket, io, handlers));

  
});

