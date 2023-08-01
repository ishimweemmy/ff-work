import User from "@/domains/users/models/UserModel"
import Dataset from "@/domains/datasets/model"
import supertest from "supertest"

export type SignupBody = {
  fullName: string,
  email: string,
  password: string
}

export async function clearUsers() {
  await User.deleteMany({})
}

export async function clearDatasets() {
  await Dataset.deleteMany({})
}

export async function findUsers(query: object) {
  return await User.find(query)
}

export async function createUser(user: object) {
  return await new User(user).save()
}

export async function signup(body: SignupBody, api: supertest.SuperTest<supertest.Test>) {
  await api.post('/api/auth/signup').send(body)
}

export async function logout(api: supertest.SuperTest<supertest.Test>) {
  await api.post('/api/auth/logout')
}