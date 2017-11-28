"use strict";

const gameState = require('../game_state');
const connectRedis = require('../db/redis_connect').connect;
const mongoConnect = require('../db/mongo_connect').mongoConnect;
const closeMongoConnect = require('../db/mongo_connect').closeMongoConnect;
const gameUtils = require('../db/game_utils');
const getGame = require('../message_handlers/share_functions').getGame;
const _ = require('underscore');
var path = require('path');
const logger = require('../utils/logger').logger(path.basename(__filename));
const moment = require('moment');

let createUser = (userParams) => {
  var json = {"country":"CF", "province":"", 
  "headimgurl":"http://wx.qlogo.cn/mmopen/vi_32/nsic4ThicIrYJsQRyHF1X3u4ibicwPVzju313TenXN7g1hibFVDHXzxNBcI1vw3AuLjl7ORHJ3YTh7K1gausEvP8LRg/0", "unionid":"omrAqw7EEY80efZ0J-UMWMmPurbkcc", "openid":"oa75AwGrHnBaj-1rlkMZaOazzvZ4cc", 
  "nickname":"test1", "city":"",
   "sex":1, "language":"zh_CN", "privilege":[]}
  
  json = _.extend(json, userParams);

  let mongoConnection = mongoConnect();

  let checkUserExists = (json) => {
    return mongoConnection.then(db => {
      return db.collection('users').findOne({unionid: json.unionid}).then( user => {
          if (!user) {
            return {exists: false}
          }
          else {
            return {exists: true, user: user}
          }
        })
    })
  }

  let createUser = (checkResult) => {
    if (!checkResult.exists) {
      return Promise.resolve(json.userId).then( newUserId => {
        return mongoConnection.then(db =>{
          return db.collection('users').insertOne(_.extend({userId: newUserId, createTime: moment().format('YYYY-MM-DD HH:mm:ss')}, json))
            .then( result => {
              if (result.result.ok != 1) {
                return Promise.reject("createUserIfNeed：创建用户失败");
              }
              return _.extend({userId: newUserId}, json);
            });
        })
      });
    } else {
      return checkResult.user;
    }
  }

  let done = () => {
    closeMongoConnect(mongoConnection);
  }

  let failHandler = (error) => {
    logger.error("ERROR: " +  error);
    closeMongoConnect(mongoConnection);
  }

  checkUserExists(json)
    .then(createUser)
    .then(done)
    .catch(failHandler);
}

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

createUser({userId: '7654321', 'unionid': '7654321', nickname: '7654321', headimgurl: 'http://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83ercUcNbFyyGQUZEwiaSM5X1mylHCibYpfIiaYbysg2FA0ibtwVPBaxSRktg3h2UHTJTAaTwIJjsfrwlmg/0'});
for(var i = 0; i < 10; i++) {
  let getUserId = (i) => {return 'test' + i};
  let getImageUrl = (i) => { return  imageUrls[i % imageUrls.length]};
  createUser({userId: getUserId(i), 'unionid': getUserId(i), nickname: getUserId(i), headimgurl: getImageUrl(i)});
}

