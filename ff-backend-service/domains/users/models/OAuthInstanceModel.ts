import mongoose from 'mongoose'
import { randomName } from '../../../utils/random'

export interface IOAuthInstance {
  client: mongoose.Types.ObjectId,
  user_code: string,
  device_code: string,
  created_at: Date,
  access_token?: string,
  scope: string[],
  state: 'pending' | 'approved' | 'rejected' | 'expired',
}

const OAuthInstanceSchema = new mongoose.Schema<IOAuthInstance>({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'OAuthClient',
  },
  user_code: {
    type: String,
    required: true,
    default: () => `${randomName(4)}-${randomName(4)}`,
  },
  device_code: {
    type: String,
    required: true,
    default: () => `${randomName(32)}`,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
  access_token: {
    type: String,
  },
  scope: {
    type: [String],
    required: function () {
      return Array.isArray(this) && this.length > 0
    },
  },
  state: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
  },
})

const OAuthInstance = mongoose.model<IOAuthInstance>('OAuthInstance', OAuthInstanceSchema)

export default OAuthInstance
