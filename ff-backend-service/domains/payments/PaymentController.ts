import { Request, Response } from 'express'
import { UnauthorizedError } from '@/utils/errors'

import PaymentServices from './PaymentService'

export async function createUserSubscriptionUrl (request: Request, response: Response) {
  if (!request.user) {
    throw new UnauthorizedError('You have not signed in to the service yet!')
  }
  const productType = request.body.tier
  const sessionUrl = await new PaymentServices(request.user).createUserSubscriptionUrl(request.user, productType)
  response.json({
    success: true,
    data: sessionUrl,
  })
}

export async function portalSession (request: Request, response: Response) {
  if (!request.user) {
    throw new UnauthorizedError('You have not signed in to the service yet!')
  }
  const sessionUrl = await new PaymentServices(request.user).createPortalSession(request.user)
  response.json({
    success: true,
    data: sessionUrl
  })
}