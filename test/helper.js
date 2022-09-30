/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
/* eslint-disable consistent-return */
require('module-alias/register')

const server = require('~/server')
const { storage } = require('~/storage')

const host = 'http://localhost:3000'

// eslint-disable-next-line no-unused-vars
async function prepare(t, options = {}) {
  // server setup
  await server.init()

  // teardown event after all tests
  t.teardown(async () => {
    await server.close()
  })

  return t
}

module.exports = {
  host,
  prepare,
  storage,
}
