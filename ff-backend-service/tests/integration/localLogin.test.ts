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

const OAUTH_USER = {
  fullName: "Elon Musk",
  email: "emusk@tesla.com",
  provider: "google"
}

describe('local login', () => {
  beforeAll(async () => {
    await setup()
    await helper.clearUsers()
    await helper.signup(USER, api)
    await helper.createUser(OAUTH_USER)
  })
  afterAll(async () => {
    await teardown()
  })

  test('logging out returns a status code 200', async () => {
    await api.get('/api/auth/logout').expect(200)
  })

  test('logging in with correct credentials returns code 200', async () => {
    const response = await api.post('/api/auth/login').send({ email: USER.email, password: USER.password }).expect(200)
    const user = response.body.data
    expect(user.fullName).toEqual(USER.fullName)
    await helper.logout(api)
  })

  test('logging in with an incorrect username returns code 401', async () => {
    await api.post('/api/auth/login').send({ email: 'snadella@outlook.com', password: USER.password }).expect(401)
  })

  test('logging in with an incorrect password returns code 401', async () => {
    await api.post('/api/auth/login').send({ email: USER.email, password: 'wrongpassword' }).expect(401)
  })

  test('logging in without a username returns code 401', async () => {
    await api.post('/api/auth/login').send({ password: USER.password }).expect(401)
  })

  test('logging in without a password returns code 401', async () => {
    await api.post('/api/auth/login').send({ email: USER.email }).expect(401)
  })

  test('inputting a password for an oauth account returns code 401', async () => {
    await api.post('/api/auth/login').send({ email: OAUTH_USER.email, password: USER.password }).expect(401)
  })
})