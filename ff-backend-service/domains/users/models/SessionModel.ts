import mongoose from 'mongoose'

export interface ISession {
  _id: string,
  expires: Date,
  lastModified: Date,
}

const SessionSchema = new mongoose.Schema<ISession>({
  _id: {
    type: String,
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
  lastModified: {
    type: Date,
    required: true,
  },
})

const Session = mongoose.model<ISession>('Session', SessionSchema)

export default Session
