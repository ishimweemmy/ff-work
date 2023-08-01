import { ObjectId } from '@/utils/abbreviations'
import mongoose, { HydratedDocument } from 'mongoose'
import { MODEL_NAMES } from '@/configuration'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import { IPullRequestAnnotation } from '@/domains/pullRequests/items/annotations/model'
import { SUPPORTED_ASSET_TYPE_ENUM } from '@/domains/assets/enums'
import { InvalidOperationError, NotFoundError } from '@/utils/errors'
import PullRequest from '@/domains/pullRequests/model'
import { IDataset } from '@/domains/datasets/model'
import * as datasetUtils from '@/domains/datasets/utils'

export interface IPullRequestAsset {
  _id: ObjectId;
  itemType: 'asset',
  type: Flockfysh.SupportedAssetType;
  pullRequest: ObjectId;
  uploadedAt: Date;
  size: number;
  displayName: string;
  mimetype: string;
}

const PullRequestAssetSchema = new mongoose.Schema<IPullRequestAsset>({
  itemType: {
    type: String,
    enum: ['asset'],
    default: 'asset',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: SUPPORTED_ASSET_TYPE_ENUM._def.values,
    async validator (this: HydratedDocument<IPullRequestAsset>, assetType: Flockfysh.SupportedAssetType) {
      const pullRequest = await PullRequest.findOne({
        _id: this.pullRequest,
      }).populate<{ dataset: IDataset }>('dataset')
      if (!pullRequest) {
        throw new NotFoundError('Missing dataset!')
      }
      datasetUtils.verifyAssetTypeCompatibility(pullRequest.dataset, assetType)
      return true
    }
  },
  pullRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.pullRequest,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: () => new Date(),
    required: true
  },
  size: {
    type: Number,
    required: true,
    default: 0,
  },
  displayName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
    default: 'application/octet-stream',
  },
})

PullRequestAssetSchema.virtual('annotationData', {
  foreignField: 'targetedPullRequestAsset',
  localField: '_id',
  ref: MODEL_NAMES.pullRequestAnnotation,
})
PullRequestAssetSchema.plugin(MongoPaging.mongoosePlugin)

const PullRequestAsset = mongoose.model<IPullRequestAsset, MongooseCursorPaginationModel<IPullRequestAsset, {}, {}, {
  annotationData?: IPullRequestAnnotation[],
}>>(MODEL_NAMES.pullRequestAsset, PullRequestAssetSchema)

export default PullRequestAsset