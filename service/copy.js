const levelup = require('levelup')
const leveldown = require('leveldown')
const QueueJobs = require('level-jobs')

const { storage } = require('~/storage')
const logger = require('~/logger')

const db = levelup(leveldown('./db'))
const DELETE_SUCCESS_TIMEOUT = 10 * 60 * 1000 // 10 min

async function copy(id, payload, done) {
  try {
    await db.put(`j${id}`, 'working')

    // do work
    const { from, to, path } = payload
    const storageFrom = storage[from.region]
    if (storageFrom == null) {
      logger.error({ msg: 'unsupported from region', from: payload.from, jobId: id })
      throw new Error(`unsupported from region: ${payload.from.region}`)
    }

    const storageTo = storage[to.region]
    if (storageTo == null) {
      logger.error({ msg: 'unsupported to region', to: payload.to, jobId: id })
      throw new Error(`unsupported to region: ${payload.to.region}`)
    }

    const checkFrom = await storageFrom.check()
    if (!checkFrom) {
      logger.error({ msg: 'check from region access failed', from: payload.from, jobId: id })
      throw new Error(`check from region access failed: ${payload.from.region}`)
    }

    const checkTo = await storageTo.check()
    if (!checkTo) {
      logger.error({ msg: 'check to region access failed', to: payload.to, jobId: id })
      throw new Error(`check to region access failed: ${payload.to.region}`)
    }

    const promises = []
    const listFile = await storageFrom.list(path)

    listFile.forEach((f) => {
      promises.push((async () => {
        const fromStream = await storageFrom.get(f.name)
        await storageTo.put(f.name, fromStream)
      })())
    })

    await Promise.all(promises)

    await db.put(`j${id}`, 'success')
    logger.info({
      msg: 'success copy job', from: payload.from, to: payload.to, path: payload.path, jobId: id,
    })

    // remove success status after 10 min
    setTimeout(async () => {
      await db.del(`j${id}`)
    }, DELETE_SUCCESS_TIMEOUT)

    done()
  } catch (err) {
    logger.error({
      msg: 'error copy data', from: payload.from, to: payload.to, path: payload.path, jobId: id,
    })

    await db.put(`j${payload.id}`, 'error')
    throw err
  }
}

module.exports = (fastify, option, next) => {
  // fastify.addHook('preHandler', fastify.$auth)

  const queue = QueueJobs(db, copy, {
    maxConcurrency: 2,
    maxRetries: 4,
  })

  fastify.post('/copy', async (request, reply) => {
    const data = request.body

    if (data.from == null) {
      reply.code(400)
      reply.send({ statusCode: 400, error: 'error from data empty' })
      return
    }

    if (data.to == null) {
      reply.code(400)
      reply.send({ statusCode: 400, error: 'error to data empty' })
      return
    }

    if (data.path == null) {
      reply.code(400)
      reply.send({ statusCode: 400, error: 'error copy path empty' })
      return
    }

    if (data.from.region === data.to.region) {
      reply.code(400)
      reply.send({ statusCode: 400, error: 'error copy to same region' })
      return
    }

    const jobId = queue.push({
      from: {
        region: data.from.region,
        bucket: data.from.bucket,
      },
      to: {
        region: data.to.region,
        bucket: data.to.bucket,
      },
      path: data.path,
    })
    await db.put(`j${jobId}`, 'pending')

    reply.send({ job: { id: jobId }, statusCode: 200 })
  })

  fastify.get('/copy/:id', async (request, reply) => {
    let status = await db.get(`j${request.params.id}`)
    if (status == null) {
      status = 'not-found'
    } else {
      status = status.toString()
    }

    return { job: { id: request.params.id, status }, statusCode: 200 }
  })

  fastify.delete('/copy/:id', async (request, reply) => {
    let jobId = null
    if (request.body && request.body.job && request.body.job.id) {
      jobId = request.body.job.id
    }
    if (jobId == null) {
      reply.code(400)
      reply.send({ statusCode: 400, error: 'error job not found' })
      return
    }

    queue.del(jobId, (err) => {
      if (err) {
        logger.error({ msg: 'error job delete', jobId, error: err.stack || err })
        reply.code(400)
        reply.send({ statusCode: 400, error: 'error job delete' })
        return
      }

      reply.send({ statusCode: 200 })
    })
  })

  next()
}
