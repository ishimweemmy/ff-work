import mongoose, { HydratedDocument } from 'mongoose'
import Post from '../model'
import User from '@/domains/users/models/UserModel'
import { MODEL_NAMES } from '@/configuration'

const Schema = mongoose.Schema

export interface IPostLike {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date
}

const postLikeSchema = new Schema<IPostLike>({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Post.modelName,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName,
  },
  createdAt: {
    type: Date
  }
})

postLikeSchema.set('toJSON', {
  virtuals: true,
})

postLikeSchema.pre('save', function (this: HydratedDocument<IPostLike>, next) {
  if (!this.createdAt) {
    this.createdAt = new Date()
  }
  next()
})

postLikeSchema.index({ post: 1, user: 1}, { unique: true });

const PostLike = mongoose.model<IPostLike>(MODEL_NAMES.postLike, postLikeSchema)
export default PostLike
