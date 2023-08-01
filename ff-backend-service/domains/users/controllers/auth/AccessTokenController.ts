import OAuthAccessToken from '../../models/OAuthAccessTokenModel'
import { UnauthorizedError } from '@/utils/errors'
import express from 'express'
import { HydratedDocument } from 'mongoose'
import { IUser } from '@/domains/users/models/UserModel'

export async function parseAuthorizationHeader (request: express.Request, response: express.Response, next: express.NextFunction) {
  const accessTokenArray = request.headers.authorization?.split(' ')
  if (!accessTokenArray) {
    throw new UnauthorizedError('The access token does not exist or is invalid.')
  }
  const [tokenType, tokenString] = accessTokenArray
  const accessTokenData = await OAuthAccessToken.findOne({
    token_type: tokenType,
    access_token: tokenString,
  }).populate<{ user: HydratedDocument<IUser> }>({ path: 'user' })
  if (!accessTokenData) {
    throw new UnauthorizedError('Endpoint can\'t be used. The access token is invalid.')
  }
  request.user = accessTokenData.user
  next()
}
