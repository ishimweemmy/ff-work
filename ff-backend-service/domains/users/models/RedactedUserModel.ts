import mongoose, { Schema } from 'mongoose'
import { ObjectId } from '@/utils/abbreviations'
import { MODEL_NAMES } from '@/configuration'
import User, { IUser, IUserPhotoSchema, UserPhotoSchema } from '@/domains/users/models/UserModel'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'

export interface IRedactedUser {
  _id: ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  profilePhoto?: IUserPhotoSchema;
  headerPhoto?: IUserPhotoSchema;
  followers?: ObjectId[];
  followings?: ObjectId[];
}

const RedactedUserSchema = new mongoose.Schema<IRedactedUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    index: 'text',
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    index: 'text',
    required: true,
  },
  username: {
    type: String,
    unique: true,
    default: function (this: IUser) {
      return `user_${this._id.toString()}`
    }
  },
  profilePhoto: UserPhotoSchema,
  headerPhoto: UserPhotoSchema,
  followers: {
    type: Array<ObjectId>,
    required: false
  },
  followings: {
    type: Array<ObjectId>,
    required: false
  }
})

RedactedUserSchema.plugin(MongoPaging.mongoosePlugin)

const RedactedUser = mongoose.model<IRedactedUser, MongooseCursorPaginationModel<IRedactedUser>>(MODEL_NAMES.redactedUser, RedactedUserSchema)

export const redactUserPipeline = {
  $project: {
    email: 1,
    firstName: 1,
    lastName: 1,
    fullName: 1,
    username: 1,
    profilePhoto: 1,
    headerPhoto: 1,
  }
};

User.init().then(async () => {
  await RedactedUser.collection.drop()
  await RedactedUser.createCollection({
    viewOn: User.collection.collectionName,
    pipeline: [
      {
        $match: {},
      },
      redactUserPipeline
    ]
  })
})

export default RedactedUser