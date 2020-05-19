const winston = require('winston');

winston.addColors({
  info: 'green',
  warn: 'cyan',
  error: 'red',
  verbose: 'blue',
  i: 'gray',
  db: 'magenta'
});

function pad(width, string, padding) { 
  return (width <= string.length) ? string : pad(width, padding + string, padding)
}

const { createLogger, format, transports } = require('winston');
const { combine,timestamp, label, printf } = format;
const moment = require('moment');

const myFormat = printf(info => {
  return `[${moment(info.timestamp).format('YYYY-MM-DD HH:mm:ss,SSS')}] [${pad(23, info.label, ' ')}] [${pad(5, info.level, ' ')}] ${info.message}`;
});
  
const createMyLogger = (myLabel) => {
  let logger = createLogger({
            level: 'debug',
            format: combine(
              label({ label: myLabel }),
              timestamp(),
              myFormat
            ),
            transports: [
              //
              // - Write to all logs with level `info` and below to `combined.log` 
              // - Write all logs error (and below) to `error.log`.
              //
              new winston.transports.File({ filename: '../error.log', level: 'error' }),
              new winston.transports.File({ filename: '../combined.log' })
            ]
          });

  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  //if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      colorize: 'true',
      format:  combine(
        label({ label: myLabel }),
        timestamp(),
        myFormat
      )
    }));
  //}
  
  return logger;
}



module.exports = {
  logger: createMyLogger
  
}