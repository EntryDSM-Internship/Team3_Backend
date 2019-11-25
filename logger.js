const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'info.log'}),
        new winston.transports.File({filename: 'error.log'})
    ]
});

module.exports = logger;