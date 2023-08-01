import '@/tests/unit/base'
import signUp from '@/domains/users/services/signUp'
import User, { IUser } from '@/domains/users/models/UserModel'
import { InvalidArgumentsError, UnauthorizedError } from '@/utils/errors'
import { ObjectId } from '@/utils/abbreviations'
import { fakerEN } from '@faker-js/faker'
import { setup, teardown } from '@/tests/unit/base'
import RedactedUser from '@/domains/users/models/RedactedUserModel'
import UserRepository from '@/domains/users/repository'
import fs from 'fs'
import mime from 'mime-types'
import axios from 'axios'
import { MongoServerError } from 'mongodb'
import * as console from 'console'
import mongoose from 'mongoose'

const TEST_PROFILE_ASSET = './tests/assets/images/images-1.jpg'

describe('user', () => {
  beforeAll(async () => {
    await setup()
  })
  afterAll(async () => {
    await teardown()
  })
  test('New user has ID, full name and hash/salt.', async () => {
    const dummyUser: Partial<IUser> = {
      _id: new ObjectId('646f5ad41d733c67e82e0129'),
      email: 'developer@test.net',
      fullName: 'Test Account',
      password: 'testPassword',
      provider: 'local',
    }
    const newUser = await signUp(dummyUser)
    expect(newUser.email).toEqual(dummyUser.email)
    expect(newUser.hash).toBeTruthy()
    expect(newUser.salt).toBeTruthy()
    expect(newUser.provider).toEqual('local')
    expect(newUser.firstName).toEqual('Test')
    expect(newUser.lastName).toEqual('Account')
    expect(newUser.username).toEqual(`user_${newUser._id.toString()}`)
  })
  test('Change username.', async () => {
    const result = await User.findOne({
      _id: new ObjectId('646f5ad41d733c67e82e0129'),
    })
    if (!result) {
      throw new Error('User not found - test stopping.')
    }
    await new UserRepository().changeUsername(result, 'testUser')

    const result2 = await User.findOne({
      _id: new ObjectId('646f5ad41d733c67e82e0129'),
    })
    expect(result2?.username).toEqual('testUser')
  })
  test('You cannot sign in again with the same email.', async () => {
    const dummyUser: Partial<IUser> = {
      email: 'Developer@test.net',
      fullName: 'Test Account',
      password: 'testPassword',
      provider: 'local',
    }
    await expect(async () => await signUp(dummyUser)).rejects.toBeInstanceOf(InvalidArgumentsError)
  })
  test('You cannot sign in again with the same username (case insensitive).', async () => {
    const dummyUser: Partial<IUser> = {
      email: 'developer2@test.net',
      fullName: 'Test Account',
      username: 'TestUser',
      password: 'testPassword',
      provider: 'local',
    }
    await expect(signUp).rejects;
    try {
      await signUp(dummyUser);
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidArgumentsError);
    }
  })
  test('Stress test - beware of Stripe rate limits.', async () => {
    for (let i = 0; i < 3; i++) {
      const dummyUser: Partial<IUser> = {
        email: fakerEN.internet.email(),
        fullName: fakerEN.person.fullName(),
        password: fakerEN.internet.password(),
        provider: 'local',
      }
      await signUp(dummyUser)
    }
  })
  test('Must be able to find redacted users.', async () => {
    const result = await RedactedUser.find()
    expect(result.length).toBeGreaterThan(0)
    for (let redacted of result) {
      expect(typeof redacted.fullName).toEqual('string')
      expect(typeof redacted.email).toEqual('string')
      expect(typeof redacted.firstName).toEqual('string')
      expect(typeof redacted.lastName).toEqual('string')
      expect(typeof redacted.username).toEqual('string')
      expect(redacted._id).toBeInstanceOf(ObjectId)
      expect((redacted as IUser).hash).toEqual(undefined)
      expect((redacted as IUser).salt).toEqual(undefined)
      expect((redacted as IUser).tier).toEqual(undefined)
    }
  })
  test('Changing profile photo must work.', async () => {
    const file = {
      buffer: await fs.promises.readFile(TEST_PROFILE_ASSET),
      mimetype: mime.lookup(TEST_PROFILE_ASSET) || '',
      path: TEST_PROFILE_ASSET,
    } as Express.Multer.File

    {
      const user = (await User.findById(new ObjectId('646f5ad41d733c67e82e0129')))!
      await new UserRepository().changeProfilePhoto(user!, file)
    }

    {
      const user = (await User.findById(new ObjectId('646f5ad41d733c67e82e0129')))!
      expect(user.profilePhoto?.url).toBeTruthy()
      const actualBuf = (await axios.get(user.profilePhoto!.url, {
        responseType: 'arraybuffer',
      })).data
      expect(file.buffer.equals(actualBuf)).toEqual(true)
    }
  })
  test('Changing header photo must work.', async () => {
    const file = {
      buffer: await fs.promises.readFile(TEST_PROFILE_ASSET),
      mimetype: mime.lookup(TEST_PROFILE_ASSET) || '',
      path: TEST_PROFILE_ASSET,
    } as Express.Multer.File

    {
      const user = (await User.findById(new ObjectId('646f5ad41d733c67e82e0129')))!
      await new UserRepository().changeHeaderPhoto(user!, file)
    }

    {
      const user = (await User.findById(new ObjectId('646f5ad41d733c67e82e0129')))!
      expect(user.headerPhoto?.url).toBeTruthy()
      const actualBuf = (await axios.get(user.headerPhoto!.url, {
        responseType: 'arraybuffer',
      })).data
      expect(file.buffer.equals(actualBuf)).toEqual(true)
    }
  })
})
