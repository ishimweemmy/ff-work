import mongoose from 'mongoose'

export interface IOAuthClient {
  secret?: string,
  name: string,
  website: string,
  is_internal: boolean,
}

const OAuthClientSchema = new mongoose.Schema<IOAuthClient>({
  secret: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  website: {
    type: String,
  },
  is_internal: {
    type: Boolean,
    required: true,
    default: false,
  }
})

const OAuthClient = mongoose.model<IOAuthClient>('OAuthClient', OAuthClientSchema)

void async function refreshInternalClients () {
  try {
    await OAuthClient.insertMany([
      {
        _id: new mongoose.Types.ObjectId('6408304b701b3a4f3f31e9a3'),
        website: 'https://flockfysh.ai',
        name: 'Flockfysh CLI',
        isInternal: true,
      }
    ])
  } catch (e) {
  }
}()

export default OAuthClient
