import supertest from 'supertest'
import app from '@/app'
import { setup, teardown } from './base'
import * as helper from './helper'

const api = supertest(app)

const USER = {
  fullName: "Sundar Pichai",
  email: "spichai@gmail.com",
  password: "bardisawesome12"
}

describe('create dataset', () => {
  beforeAll(async () => {
    await setup()
    await helper.clearUsers()
    await helper.clearDatasets()
    await helper.signup(USER, api)
  })
  afterAll(async () => {
    await teardown()
  })

  test('creating a valid dataset returns 200', async () => {
    await api.post('/api/datasets/')
  })
})