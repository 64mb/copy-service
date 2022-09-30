const logger = require('~/logger')
const { S3 } = require('~/s3')

/**
* @type {Object.<string, Object.<string, S3>>}
*/
const storage = {}

async function init() {
  logger.info({ msg: 'init s3 region endpoint' })

  /** @type {Array.<S3>} */
  const s3List = []

  let s3Seed = Object.keys(process.env)
    .filter((x) => x.match(/[A-Z\d]{2}_S3_/))
    .map((x) => x.split('_').shift())
  s3Seed = [...new Set(s3Seed)]

  const s3Log = {}
  s3Seed.forEach((s3) => {
    s3Log[s3] = process.env[`${s3}_S3_ENDPOINT`]
  })

  logger.info({ msg: 'detect s3 list', ...s3Log })

  s3Seed.forEach((s3) => {
    const client = new S3(process.env[`${s3}_S3_ENDPOINT`],
      process.env[`${s3}_S3_BUCKET`],
      process.env[`${s3}_S3_ACCESS_KEY`],
      process.env[`${s3}_S3_SECRET_KEY`],
      {
        logger,
        port: parseInt(process.env[`${s3}_S3_PORT`] || 443),
        domain: process.env[`${s3}_S3_ENDPOINT`],
        region: s3,
      })

    s3List.push(client)
    storage[s3] = client
  })

  // eslint-disable-next-line no-restricted-syntax
  for (const client of s3List) {
    try {
      logger.info({ msg: 's3 init', endpoint: client.endpoint })

      await client.check()

      logger.info({ msg: 's3 ini success', endpoint: client.endpoint, region: client.region })
    } catch (err) {
      logger.error({
        msg: 'error s3 init', endpoint: client.endpoint, region: client.region, error: err.stack || err,
      })
    }
  }
}

module.exports = {
  init,
  storage,
}
