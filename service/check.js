const { storage } = require('~/storage')

module.exports = (fastify, option, next) => {
  fastify.get('/check', async (request, reply) => {
    const checked = {}
    const region = Object.keys(storage)

    const promises = region.map((reg) => (async () => {
      checked[reg] = await storage[reg].check()
    })())

    await Promise.all(promises)

    return { storage: checked, statusCode: 200 }
  })

  next()
}
