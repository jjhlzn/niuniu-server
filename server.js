var registerNiuNiuHandlers = require('./niu/message_handlers/index').registerMessageHandlers
var register13Handlers = require('./13shui/handlers/index').registerMessageHandlers
var registerRoutes = require('./http_handlers/index').registerRoutes

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var http = require('http').Server(app);
const io = require('socket.io')(http);

var path = require('path');
const logger = require('./utils/logger').logger(path.basename(__filename));

registerRoutes(app);
io.on('connection', socket => {
  logger.debug("a new clent come in");
  //register 牛牛 message handlers 
  registerNiuNiuHandlers(io, socket)
  register13Handlers(io, socket)
});

http.listen(3001);


