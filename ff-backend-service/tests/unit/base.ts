import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server-core'
import * as console from 'console'
import * as process from 'process'

dotenv.config({
  path: './.env.test.local'
})

let server: MongoMemoryReplSet
jest.setTimeout(30000)

export async function setup () {
  server = await MongoMemoryReplSet.create({
    binary: {
      systemBinary: '/usr/bin/mongod',
    },
    replSet: {
      count: 3,
    },
  })
  const uri = server.getUri()
  const config = await import('@/utils/config')
  await mongoose.connect(uri, {
    dbName: 'flockfysh_testing',
  }).then(() => {
    console.log('Connected to MongoDB')
  })
}

export async function teardown () {
  await mongoose.disconnect()
  await server.stop({
    force: true,
    doCleanup: true,
  })
  await mongoose.disconnect()
  setTimeout(() => {
    process.exit(0)
  }, 500)
}