import supertest from 'supertest'
import app from '@/app'
import { setup, teardown } from './base'
import * as helper from './helper'

const api = supertest(app)

describe('local signup', () => {
  beforeAll(async () => {
    await setup()
    await helper.clearUsers()
  })
  afterAll(async () => {
    await teardown()
  })

  test('signing up with a valid name, password, and email returns status code 200', async () => {
    const BODY = {
      fullName: "Sundar Pichai",
      email: "spichai@gmail.com",
      password: "bardisawesome12"
    }
    await api.post('/api/auth/signup').send(BODY).expect(200)
  })

  test('signing up correctly creates a new user object in the database', async () => {
    const user = (await helper.findUsers({ fullName: "Sundar Pichai" }))[0]
    expect(user).toBeDefined()
    expect(user.email).toEqual('spichai@gmail.com')
    expect(user.provider).toEqual('local')
  })

  test('password is not present in the user object', async () => {
    const user = (await helper.findUsers({ fullName: "Sundar Pichai" }))[0]
    expect(user.password).toBeUndefined()
  })

  test('signing up without a name returns status code 400', async () => {
    const BODY = {
      email: "spichai@gmail.com",
      password: "bardisawesome12"
    }
    await api.post('/api/auth/signup').send(BODY).expect(400)
  })

  test('signing up without an email returns status code 400', async () => {
    const BODY = {
      fullName: "Sundar Pichai",
      password: "bardisawesome12"
    }
    await api.post('/api/auth/signup').send(BODY).expect(400)
  })

  test('signing up with an invalid email returns status code 400', async () => {
    const BODY = {
      fullName: "Sundar Pichai",
      email: "spichai",
      password: "bardisawesome12"
    }
    await api.post('/api/auth/signup').send(BODY).expect(400)
  })

  test('signing up without a password returns status code 400', async () => {
    const BODY = {
      fullName: "Sundar Pichai",
      email: "spichai@gmail.com"
    }
    await api.post('/api/auth/signup').send(BODY).expect(400)
  })
})