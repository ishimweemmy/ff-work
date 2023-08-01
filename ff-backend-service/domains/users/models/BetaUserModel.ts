import mongoose from 'mongoose'

export interface IBetaUser {
  email: string,
  accepted: boolean,
}

const BetaUserSchema = new mongoose.Schema<IBetaUser>({
  email: {
    type: String,
    required: true,
  },
  accepted: {
    type: Boolean,
    default: false,
  }
})

const BetaUser = mongoose.model<IBetaUser>('BetaUser', BetaUserSchema)

export default BetaUser
