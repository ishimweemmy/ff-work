import mongoose from 'mongoose'
import { randomName } from '@/utils/random'

export interface IOAuthAccessToken {
  access_token: string,
  token_type: string,
  client: mongoose.Types.ObjectId,
  user: mongoose.Types.ObjectId,
  scope: string[],
  ip_address: string,
}

const OAuthAccessTokenSchema = new mongoose.Schema<IOAuthAccessToken>({
  access_token: {
    type: String,
    required: true,
    default: () => randomName(32),
  },
  token_type: {
    type: String,
    required: true,
    default: 'Bearer',
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'OAuthClient',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scope: {
    type: [String],
    required: function () {
      return Array.isArray(this) && this.length > 0
    },
  },
  ip_address: {
    type: String,
    required: true,
  }
})

const OAuthAccessToken = mongoose.model<IOAuthAccessToken>('OAuthAccessToken', OAuthAccessTokenSchema)

export default OAuthAccessToken
