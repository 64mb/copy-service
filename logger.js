const pino = require('pino')

const logger = pino({
  formatters: {
    // eslint-disable-next-line no-unused-vars
    level(label, number) {
      return { level: label }
    },
  },
  customPrettifiers: {
    error: (value) => value.replace(/\\n/g, '\n'),
  },
})

const VALID_LOGS_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug']
if (
  process.env.LOG_LEVEL
    && process.env.LOG_LEVEL !== ''
    && VALID_LOGS_LEVELS.indexOf(process.env.LOG_LEVEL) > -1
) {
  logger.level = process.env.LOG_LEVEL
} else {
  logger.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'
}

module.exports = logger
