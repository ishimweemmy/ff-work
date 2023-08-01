import { ObjectId } from '@/utils/abbreviations'
import mongoose, { HydratedDocument } from 'mongoose'
import { MODEL_NAMES } from '@/configuration'
import { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import Asset, { IAsset } from '@/domains/assets/model'
import PullRequest from '@/domains/pullRequests/model'

export interface IPullRequestDeleteAsset {
  _id: ObjectId;
  itemType: 'deleteAsset';
  pullRequest: ObjectId;
  targetedAsset: ObjectId;
}

const PullRequestDeleteAssetSchema = new mongoose.Schema<IPullRequestDeleteAsset>({
  itemType: {
    type: String,
    enum: ['deleteAsset'],
    default: 'deleteAsset',
    required: true,
  },
  pullRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.pullRequest,
    required: true,
  },
  targetedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.asset,
    required: true,
    validate: {
      async validator (this: HydratedDocument<IPullRequestDeleteAsset>, assetOrId?: IAsset | ObjectId) {
        if (!assetOrId) return true
        const id = assetOrId._id
        const asset = await Asset.findOne({
          _id: id,
        })
        if (!asset) {
          throw new Error('Cannot find asset to bind the annotation to.')
        }
        const pullRequest = await PullRequest.findOne({
          _id: this.pullRequest._id,
        })
        if (!pullRequest) {
          throw new Error('This pull request is not found or has been deleted.')
        }
        if (!pullRequest.dataset.equals(asset.dataset)) {
          throw new Error('Targeted asset must belong to the same dataset as the pull request.')
        }
        return true
      }
    }
  },
})

const PullRequestDeleteAsset = mongoose.model<IPullRequestDeleteAsset, MongooseCursorPaginationModel<IPullRequestDeleteAsset>>(MODEL_NAMES.pullRequestDeleteAsset, PullRequestDeleteAssetSchema)

export default PullRequestDeleteAsset