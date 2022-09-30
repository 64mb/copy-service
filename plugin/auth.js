const fp = require('fastify-plugin')
const jwt = require('jsonwebtoken')

module.exports = fp((fastify, { header = 'authorization', secret }, next) => {
  if (secret == null) {
    throw new Error('auth plugin secret undefined')
  }

  async function check(token) {
    if (token == null) return null

    let decode = null
    try {
      decode = jwt.verify(token, secret)
    } catch (err) {
      return null
    }

    return decode
  }

  async function handler(request, reply) {
    const result = await check(request.headers ? request.headers[header] : null)

    request.auth = null

    if (result == null) {
      reply.code(403)
      return reply.send({ error: 'auth required' })
    }
    request.auth = result

    return result
  }

  fastify.decorate('$auth', handler)

  next()
})
