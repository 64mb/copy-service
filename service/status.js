module.exports = (fastify, option, next) => {
  fastify.get('/', async (request, reply) => ({ status: 'success', statusCode: 200 }))
  fastify.get('/ping', async (request, reply) => ({ status: 'success', statusCode: 200 }))

  next()
}
