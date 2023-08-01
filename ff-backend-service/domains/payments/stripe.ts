import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: '2022-11-15',
})

export default stripe