/**
 * 这个handler是用于debug的
 */
const gameService = require('../service/13/game_service')

 exports.handle = async (req, res) => {
  res.set({ 'content-type': 'application/json; charset=utf-8' });
  var json = req.body;
  let roomNo = json.roomNo

  let game = await gameService.getGame4Debug(roomNo)

  if (!game) {
    res.end(JSON.stringify({status: -1, errorMessage: '房间不存在'}))
  } else {
    res.end(JSON.stringify({status: 0, game: game}))
  }



 }