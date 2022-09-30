const fp = require('fastify-plugin')
const jwt = require('jsonwebtoken')
const logger = require('~/logger')

module.exports = fp((fastify, options, done) => {
  // temp no need
  // fastify.addHook('preSerialization', (_request, reply, payload, next) => {
  //   // eslint-disable-next-line no-underscore-dangle
  //   reply._data = payload
  //   next()
  // })

  // fastify.addHook('onSend', (_request, reply, payload, next) => {
  //   // eslint-disable-next-line no-underscore-dangle
  //   if (!reply._data) reply._data = payload
  //   next()
  // })

  fastify.addHook('onRequest', (request, reply, next) => {
    request.timing = Date.now()
    next()
  })

  fastify.addHook('onResponse', (request, reply, next) => {
    if (reply.statusCode === 404) {
      return next()
    }

    if (!(request.body instanceof Object) || typeof request.body !== 'object') {
      if (request.body != null) request.body = { spam: '...' }
    }

    const payload = { ...(request.body ? request.body : {}), ...(request.query ? request.query : {}) }

    if (request.headers != null && request.headers.authorization != null) {
      let decodedJwt = null
      try {
        decodedJwt = jwt.decode(request.headers.authorization, process.env.JWT_SECRET)
      } catch (err) {
        // pass
      }
      if (decodedJwt !== null) {
        payload.jwt = decodedJwt
      }
    }

    logger.info({
      requestId: request.id,
      timing: (Date.now() - request.timing) / 1000,
      url: request.raw.url,
      statusCode: reply.raw.statusCode,
      payload,
      headers: request.raw.headers,
      method: request.method,
      // eslint-disable-next-line no-underscore-dangle
      result: reply._data,
      msg: 'request',
    })
    return next()
  })

  done()
})
