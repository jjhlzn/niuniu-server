const checkuserInGameHandle = require('./check_user_in_game_handler').handle;
const createRoomHandle = require('./create_room_handler').handle;
const getRoomHandle = require('./get_room_handler').handle;
const loginHandle = require('./login_handler').handle;
const shareHandle = require('./share_handler').handle;
const checkUpdateHandle = require('./check_update_handler').handle;
const reportErrorHandle = require('./report_error_handler').handle;
const getGameInfoHanlde = require('./get_game_info_handler').handle;
const checkIosAuditVersionHanlde = require('./check_ios_audit_version_handler').handle;
const auditLoginHandler = require('./audit_login_handler').handle;
const getGame4DebugHanlder = require('./get_game_4_debug_handler').handle
const joinRoomHandle = require('./13/join_room_handler').handle
const express = require('express');

module.exports = {
    registerRoutes: function(app) {
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
        app.use(express.static('./clients/css'));
        app.use(express.static('node_modules'));
        app.use('/getgame4debug', getGame4DebugHanlder)
        app.use('/joinroom', joinRoomHandle)
    }
}