"use strict";
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

exports.joinRoomHandler = (socket, io) => {
  return (msg, Ack) => {
    logger.debug("Receive ResetRoom: " + JSON.stringify(msg));
    socket.join(msg.roomNo);
  }
};

