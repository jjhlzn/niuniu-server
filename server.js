var registerNiuNiuHandlers = require('./server/niu/message_handlers/index').registerMessageHandlers

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
const checkuserInGameHandle = require('./server/http_handlers/check_user_in_game_handler').handle;
const createRoomHandle = require('./server/http_handlers/create_room_handler').handle;
const getRoomHandle = require('./server/http_handlers/get_room_handler').handle;
const loginHandle = require('./server/http_handlers/login_handler').handle;
const shareHandle = require('./server/http_handlers/share_handler').handle;
const checkUpdateHandle = require('./server/http_handlers/check_update_handler').handle;
const reportErrorHandle = require('./server/http_handlers/report_error_handler').handle;
const getGameInfoHanlde = require('./server/http_handlers/get_game_info_handler').handle;
const checkIosAuditVersionHanlde = require('./server/http_handlers/check_ios_audit_version_handler').handle;
const auditLoginHandler = require('./server/http_handlers/audit_login_handler').handle;

app.use('/introduction.html', shareHandle);
app.use('/share', shareHandle);
app.use('/checkuseringame', checkuserInGameHandle);
app.use('/createroom', createRoomHandle);
app.use('/getroom', getRoomHandle);
app.use('/login', loginHandle);
app.use('/checkupdate', checkUpdateHandle);
app.use('/reporterror', reportErrorHandle);
app.use('/getgameinfo', getGameInfoHanlde);
app.use('/checkiosauditversion', checkIosAuditVersionHanlde);
app.use('/auditlogin', auditLoginHandler);
app.use(express.static('./clients'));
app.use(express.static('./clients/images'));
app.use(express.static('node_modules'));

http.listen(3001);

io.on('connection', socket => {
  logger.debug("a new clent come in");

  //register 牛牛 message handlers 
  registerNiuNiuHandlers(io, socket)

});

