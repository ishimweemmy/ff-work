import { ObjectId } from '@/utils/abbreviations'
import mongoose, { mongo } from 'mongoose'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import { MODEL_NAMES } from '@/configuration'
import z from 'zod'

export const PULL_REQUEST_STATUS_ENUM = z.enum(['draft', 'published', 'merged', 'rejected'])
export type PullRequestStatus = z.infer<typeof PULL_REQUEST_STATUS_ENUM>;

export interface IPullRequest {
  _id: ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  user: ObjectId;
  dataset: ObjectId;
  description?: string;
  status: PullRequestStatus;
}

const PullRequestSchema = new mongoose.Schema<IPullRequest>({
  name: {
    type: String,
    required: true,
    index: 'text',
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  description: {
    type: String,
    default: '',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: MODEL_NAMES.user,
  },
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: MODEL_NAMES.dataset,
  },
  status: {
    type: String,
    enum: PULL_REQUEST_STATUS_ENUM._def.values,
    required: true,
    default: 'draft',
  },
});

PullRequestSchema.plugin(MongoPaging.mongoosePlugin)

const PullRequest = mongoose.model<IPullRequest, MongooseCursorPaginationModel<IPullRequest>>(MODEL_NAMES.pullRequest, PullRequestSchema)

export default PullRequest
