import DatasetService from '../datasets/service'
import stripe from '@/domains/payments/stripe'
import { AlreadyPaidError, InvalidArgumentsError, NotFoundError } from '@/utils/errors'
import { rpcBillingMicroserviceClient } from '@/utils/rpc/rpcClient'

const PRODUCT_ID_MAPPING: Record<string, string> = {
  professional: "flockfysh_professional",
  enterprise: "flockfysh_enterprise",
}

const PAYMENT_ALREADY_COMPLETE: Record<string, (user: Express.User) => Promise<boolean>> = {
  professional: async user => user.tier === 'professional',
  enterprise: async user => user.tier === 'enterprise',
}

class PaymentServices extends DatasetService {
  async createUserSubscriptionUrl (user: Express.User, productType: string) {
    const productId = PRODUCT_ID_MAPPING[productType];
    if (!productId) {
      throw new InvalidArgumentsError('Stored product type not found.')
    }
    const product = await stripe.products.retrieve(productId);
    let price = product.default_price
    if (!price) {
      throw new Error('A default price must be configured for this product')
    } else if (typeof price === 'string') {
      price = await stripe.prices.retrieve(price)
    }
    const alreadyPaid = await PAYMENT_ALREADY_COMPLETE[productType]?.(user) ?? false
    if (alreadyPaid) {
      throw new AlreadyPaidError()
    }
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          subscription_type: 'user',
        }
      },
      mode: 'subscription',
      success_url: `${process.env.CORS_ORIGIN}/dashboard/profile`,
      cancel_url: `${process.env.CORS_ORIGIN}/dashboard/profile`,
    })

    return session.url
  }

  async createPortalSession (user: Express.User) {
    return await rpcBillingMicroserviceClient.request("billingCustomer:portal", {}, {
      user: user,
    });
  }
}

export default PaymentServices
