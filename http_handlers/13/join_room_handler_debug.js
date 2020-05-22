"use strict";

const _ = require('underscore')
const logger = require('../../utils/logger').logger(require('path').basename(__filename));
const gameService = require('../../service/13/game_service')

const joinRoomHandler = require('../../13shui/handlers/join_room_handler').joinRoomHandler

exports.handle = async (req, res) => {
  var json = req.body;
  logger.debug(req.query.a)
  logger.debug("reqJson: " + JSON.stringify(json));
  let userId = req.query.userId;
  let roomNo = req.query.roomNo

  let mockSocket = {}
  mockSocket.join = () => {}
  let mockIO = {}
  let Ack = () => {}
  mockIO.to = () => { 
      let obj = {}
      obj.emit = () => {}
      return obj
  }

  let resp = await joinRoomHandler(mockSocket, mockIO)
  (JSON.stringify({userId: userId, roomNo: roomNo}), Ack)

  return res.end(JSON.stringify(resp));
}

