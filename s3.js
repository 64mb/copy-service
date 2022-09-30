const pino = require('pino')
const minio = require('minio')

class S3 {
  ttl = 3600 // 1 hour presigned link live

  secure = '__secure__' // prefix for random generated path storage

  constructor(endpoint, bucket, accessKey, secretKey, {
    logger, ssl, port, domain, region,
  }) {
    this.logger = logger || pino()

    if (!bucket) {
      throw new Error('s3: error bucket is undefined')
    }

    this.bucket = bucket

    this.port = parseInt(port || 443) || 443
    this.ssl = ssl || this.port === 443
    this.endpoint = endpoint
    this.domain = domain
    this.region = region

    this.driver = new minio.Client({
      endPoint: endpoint,
      port: this.port,
      useSSL: this.ssl,
      accessKey,
      secretKey,
    })
  }

  async bucketPrepare() {
    if (!await this.driver.bucketExists(this.bucket)) {
      await this.driver.makeBucket(this.bucket, this.region)
    }
    return this.bucket
  }

  async check(bucket = this.bucket) {
    let result = false

    try {
      if (!(await this.driver.bucketExists(bucket))) {
        await this.driver.makeBucket(bucket, this.region)
      }
      result = true
    } catch (err) {
      this.logger.error({ msg: 'error s3 storage check', bucket, error: err.stack || err })
    }
    return result
  }

  proxy(link) {
    return `${this.domain}${link.replace(new RegExp(`https?://${this.endpoint}:?\\d*/`), '/')}`
  }

  async link(path) {
    let link = await this.driver.presignedUrl(
      'GET',
      this.bucket,
      path,
      this.ttl,
    )
    link = this.domain ? this.proxy(link) : link
    return link
  }

  get(path) {
    return this.driver.getObject(this.bucket, path)
  }

  async list(path) {
    const data = []
    const stream = await this.driver.listObjects(this.bucket, path, true)
    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => { data.push(obj) })
      stream.on('end', () => { resolve(data) })
      stream.on('error', (err) => { reject(err) })
    })

    return data
  }

  async delete(path) {
    this.driver.removeObject(this.bucket, path)
  }

  async put(path, stream) {
    await this.driver.putObject(
      this.bucket, path, stream,
    )
    return path
  }
}

module.exports = {
  S3,
}
