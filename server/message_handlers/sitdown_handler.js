"use strict";

const redisClient = require('../db/redis_connect').connect();
const gameUtils = require('../db/game_utils');
const messages = require('../messages');
const _ = require('underscore');
const getGame = require('./share_functions').getGame;
const createFailHandler = require('./share_functions').createFailHandler;
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));

function getImageUrl() {
  let imageUrls = [
    'http://p3.wmpic.me/article/2015/03/16/1426483394_eJakzHWr.jpeg',
    'http://is2.mzstatic.com/image/thumb/Purple122/v4/e5/ab/bc/e5abbc78-16cd-c1fc-8b69-503e70c50e16/source/1200x630bb.jpg',
    'http://scimg.jb51.net/touxiang/201709/2017091018241774.jpg',
    'http://www.vstou.com/upload/image/22/201612/1481847190163497.jpg',
    'http://downza.img.zz314.com/edu/pc/wlgj-1008/2016-03-31/77660051d89fb05f2ba64138ebf965e6.jpg',
    'http://www.jf258.com/uploads/2015-05-14/191202223.jpg',
    'http://m.mmwnn.com/dmtp/mimg/toxi/nv/tox566.jpeg',
    'http://www.85s.com/wp-content/uploads/2016/07/QQ%E6%88%AA%E5%9B%BE20160729180738_%E5%89%AF%E6%9C%AC.jpg',
    'http://www.85s.com/wp-content/uploads/2016/07/QQ%E6%88%AA%E5%9B%BE20160729180633_%E5%89%AF%E6%9C%AC.jpg',
    'http://www.85s.com/wp-content/uploads/2016/07/QQ%E6%88%AA%E5%9B%BE20160729180714_%E5%89%AF%E6%9C%AC.jpg'
  ];
  let index = Math.round( Math.random() * 1000000 ) % imageUrls.length;
  return imageUrls[index];
}

exports.sitdownHandler = (socket) => {
  return (msg, Ack) => {
    logger.debug("Receive SitDown: " + JSON.stringify(msg));
    
    let checkSeat = (game) => {
      return redisClient.existsAsync(gameUtils.sitdownPlayersKey(msg.roomNo))
        .then( exists => {
          if (!exists) {
            return true;
          } else {
            return redisClient.hgetallAsync(gameUtils.sitdownPlayersKey(msg.roomNo)).then(playerHash => {
              if (!playerHash) {
                return Promise.reject("获取sitdownPlayers失败");
              }

              logger.debug("sitdownPlayes: " +JSON.stringify(playerHash));
              if (playerHash[msg.userId]) {
                return Promise.reject('Player ' + msg.userId + ' has sit down');
              }
      
              let seatNos = _.values(playerHash);
              if (seatNos.filter( seatNo => {return seatNo == msg.seatNo}).length > 0) {
                return Promise.reject('Seat ' + msg.seat + ' has player: ' +playerHash[msg.seat]);
              }

              return true;
            });
          }
        });
    }

    let sit = () => {
      return redisClient.hsetAsync(gameUtils.sitdownPlayersKey(msg.roomNo), msg.userId, msg.seat).then(res => {
        if (!res) {
          return Promise.reject(res);
        } 
        return true;
      });
    }

    //TODO：检查自己是否已经在该座位上，并且把该用户的信息发送给其他用户：头像链接，nickname, sex。
    let checkSit = () => {
      Ack({status: 0});

      socket.to(msg.roomNo).emit(messages.SomePlayerSitDown, _.extend(msg, {headImageUrl: getImageUrl(), nickName: msg.userId, sex: 1, ip: "192.168.0.1"}));
    }

 
    getGame(msg.roomNo)
      .then(checkSeat)
      .then(sit)
      .then(checkSit)
      .catch(createFailHandler(Ack));
  }

}