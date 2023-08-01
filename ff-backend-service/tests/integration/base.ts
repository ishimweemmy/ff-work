import mongoose from 'mongoose'
import * as process from 'process'


jest.setTimeout(30000)

export async function setup () {
  if (process.env.NODE_ENV !== 'test') throw('NODE_ENV must equal test')
}

export async function teardown () {
  await mongoose.connection.close()
  setTimeout(() => {
    process.exit(0)
  }, 500)
}