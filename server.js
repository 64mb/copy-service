/* eslint-disable consistent-return */
require('module-alias/register')

const path = require('path')
const Fastify = require('fastify')

const logger = require('~/logger')
const storage = require('~/storage')

const fastify = Fastify({
  bodyLimit: 10485760, // increase body limit 10mb
  logger: false, // disable default logger
  disableRequestLogging: true, // disable default logger
})

fastify.register(require('~/plugin/logger'))
fastify.register(require('~/plugin/auth'), {
  secret: process.env.JWT_SECRET,
})

fastify.register(require('fastify-autoload'), {
  dir: path.join(__dirname, 'service'),
})

async function init() {
  logger.info('init start server...')

  try {
    const endpoint = await storage.init()
    logger.info({ msg: '📦 storage ready', endpoint })

    // wait all plugin load
    await fastify.ready()

    const url = await fastify.listen(process.env.HOST_PORT, process.env.HOST_IP)

    logger.info({ msg: '⚙️  server start', mode: process.env.NODE_ENV })
    logger.info({ msg: '📡 server copy ready', endpoint: url })
  } catch (err) {
    logger.fatal({ msg: '🛑 error init server', error: err.stack || err })
  }
}

function close() {
  return fastify.close()
    .catch(() => {
      process.exit(1)
    })
}

if (require.main === module) {
  // start server
  init()
} else {
  module.exports = {
    init,
    close,
  }
}

// safe stop
process.on('SIGINT', () => {
  close()
})
