"use strict";
const redis = require("redis");
var bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var redisUrl = '';
if (process.env.NODE_ENV == 'production') {
    redisUrl = '10.45.52.93';
} else {
    redisUrl = 'localhost';
}

var redisConfig = {
    detect_buffers: true, 
    host: redisUrl, 
    port: 6379,
    retry_strategy: function (options) {
        if (options.error != null && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
};

function get_redis_client() {
    return redis.createClient(redisConfig);
}

let conn = null;
module.exports = {
  connect: () => {
      if (conn == null || !conn.connected) {
         conn = redis.createClient(redisConfig);
      }
      return conn;
  }
}