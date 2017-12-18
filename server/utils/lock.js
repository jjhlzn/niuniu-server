

/**
 * 这个锁不同于其他的锁，每次获取锁的时候，检查上次获取的时间，如果获取到了，那么
 * 就更新获取的时间。
 */
const moment = require('moment');
var path = require('path');
const logger = require('./logger').logger(path.basename(__filename));

function createLock() {
  let lock = {};
  
  lock.get = (roomNo) => {
    logger.debug("try to get lock for room: " + roomNo);
    logger.debug("lock[" + roomNo + '] = ' + lock[roomNo]);
    if (lock[roomNo]) {
      //间隔2s，就可以获得锁了
      let deltaTime = moment() - lock[roomNo];
      let result = deltaTime > 2000;
      logger.debug("deltaTime = " + deltaTime);
      if (result) {
        lock[roomNo] = moment();
        return true;
      } else {
        return false;
      }
    } else {
      lock[roomNo] = moment();
      return true;
    }
  }

  return lock;
}

module.exports = {
  createLock: createLock
}

