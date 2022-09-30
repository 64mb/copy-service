/* eslint-disable max-len */
const { test } = require('tap')
const supertest = require('supertest')
const { host, prepare, storage } = require('../helper')

test('check', async (t) => {
  await prepare(t)
  const request = supertest(host)

  const response = await request.get('/check').expect(200)

  t.same(response.body, {
    storage: {
      EU: true, US: true, CN: true, RU: true,
    },
    statusCode: 200,
  })
})
