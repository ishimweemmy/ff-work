import { PrivateBetaError, UnauthorizedError } from '../utils/errors'
import BetaUser from '../domains/users/models/BetaUserModel'
import express from 'express'

export async function checkAuthorized (request: express.Request, response: express.Response, next: express.NextFunction) {
  if (!request.user) {
    throw new UnauthorizedError('You must be logged in to use this API endpoint.')
  }
  const betaEntry = await BetaUser.findOne({
    email: request.user.email,
    accepted: true,
  })
  if (!betaEntry) {
    //throw new PrivateBetaError()
  }
  next()
}
