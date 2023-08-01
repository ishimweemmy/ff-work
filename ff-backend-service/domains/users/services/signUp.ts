import User, { IUser } from '../models/UserModel'
import { HydratedDocument } from 'mongoose'
import { InvalidArgumentsError, UnauthorizedError } from '@/utils/errors'
import z from 'zod'
import { rpcBillingMicroserviceClient } from '@/utils/rpc/rpcClient'
import * as console from 'console'

export default async function signUp (userData: Partial<IUser>): Promise<HydratedDocument<IUser>> {
  const prevUser = await User.findOne({
    email: userData.email
  })
  if (prevUser) {
    const error = new UnauthorizedError('The user has already existed.')
    error.code = 'ERROR_USER_EXISTS'
    throw error
  }
  if ((!userData.firstName || !userData.lastName) && !userData.fullName) {
    const error = new InvalidArgumentsError('Missing display name.')
    error.code = 'ERROR_MISSING_NAME'
    throw error
  }
  if (!userData.fullName) {
    userData.fullName = `${userData.firstName} ${userData.lastName}`
  }
  if (!userData.firstName || !userData.lastName) {
    [userData.firstName, userData.lastName] = userData.fullName.split(/\s+/)
  }
  const userPassword = userData.password
  delete userData.password
  let user = new User(userData)
  if (userData.provider === 'local') {
    const password = z.string().parse(userPassword)
    user = await User.register(user, password)
  }
  user = await user.save()
  await rpcBillingMicroserviceClient.request("billingAccounts:ensure", {}, {
    user: user,
  });
  await rpcBillingMicroserviceClient.request("billingCustomers:ensure", {}, {
    user: user,
  });
  return user;
}
