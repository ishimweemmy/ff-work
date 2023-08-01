import mongoose, { mongo } from 'mongoose'
import { ObjectId } from '@/utils/abbreviations'
import { MODEL_NAMES } from '@/configuration'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'

export interface IPullRequestMessage {
  _id: ObjectId;
  message: string
  createdAt: Date
  updatedAt: Date
  user: ObjectId
  pullRequest: ObjectId
}

const PullRequestMessageSchema = new mongoose.Schema<IPullRequestMessage>({
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  updatedAt: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: MODEL_NAMES.user
  },
  pullRequest: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: MODEL_NAMES.pullRequest
  }
})

PullRequestMessageSchema.plugin(MongoPaging.mongoosePlugin)
const PullRequestMessage = mongoose.model<IPullRequestMessage, MongooseCursorPaginationModel<IPullRequestMessage>>(MODEL_NAMES.pullRequestMessage, PullRequestMessageSchema)
export default PullRequestMessage
