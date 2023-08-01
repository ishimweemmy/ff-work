import stripe from '@/domains/payments/stripe'
import { HydratedDocument } from 'mongoose'
import { IUser } from '@/domains/users/models/UserModel'

export default async function createStripeCustomer (user: HydratedDocument<IUser>) {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
    })
    return customer.id
  } catch (e) {
    throw e;
  }
}
