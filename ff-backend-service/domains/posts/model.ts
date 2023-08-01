import mongoose from 'mongoose'
import User from '@/domains/users/models/UserModel'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import { MODEL_NAMES } from '@/configuration'
export interface IPost {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
}

const PostSchema = new mongoose.Schema<IPost, any, {}, {}, {
  likes?: number,
}>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName,
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date()
  }
})

PostSchema.plugin(MongoPaging.mongoosePlugin)

PostSchema.virtual('likes', {
  ref: MODEL_NAMES.postLike,
  count: true,
  localField: '_id',
  foreignField: 'post',
})

const Post = mongoose.model<IPost, MongooseCursorPaginationModel<IPost, {}, {}, {
  likes?: number,
}>>('Post', PostSchema)
User.syncIndexes().then();

export default Post
