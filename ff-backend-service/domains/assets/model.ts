import mongoose, { HydratedDocument } from 'mongoose'
import { IAnnotation } from '@/domains/annotations/model'
import { ObjectId } from '@/utils/abbreviations'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import { MODEL_NAMES } from '@/configuration'
import { ASSET_STAGE_ENUM, SUPPORTED_ASSET_TYPE_ENUM } from '@/domains/assets/enums'
import { NotFoundError } from '@/utils/errors'
import Dataset from '@/domains/datasets/model'
import * as datasetUtils from '@/domains/datasets/utils'

const Schema = mongoose.Schema

export interface IAsset {
  _id: ObjectId;
  type: Flockfysh.SupportedAssetType;
  uploadedAt: Date;
  dataset: mongoose.Types.ObjectId;
  size: number;
  displayName: string;
  apiIdentifier?: string;
  stage: Flockfysh.AssetStage;
  mimetype: string;
}

const assetSchema = new Schema<IAsset>({
  type: {
    type: String,
    required: true,
    enum: SUPPORTED_ASSET_TYPE_ENUM._def.values,
    validate: {
      async validator (this: HydratedDocument<IAsset>, assetType: Flockfysh.SupportedAssetType) {
        const dataset = await Dataset.findOne({
          _id: this.dataset,
        })
        if (!dataset) {
          throw new NotFoundError('Missing dataset!')
        }
        datasetUtils.verifyAssetTypeCompatibility(dataset, assetType)
        return true
      }
    }
  },
  uploadedAt: {
    type: Date,
    default: () => new Date(),
    required: true
  },
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.dataset,
    required: true,
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
  apiIdentifier: {
    type: String,
  },
  stage: {
    type: String,
    default: 'uploaded',
    enum: ASSET_STAGE_ENUM._def.values,
  },
})

assetSchema.virtual('annotationData', {
  ref: MODEL_NAMES.annotation,
  localField: '_id',
  foreignField: 'asset',
})
assetSchema.virtual('pullRequestAnnotationData', {
  ref: MODEL_NAMES.pullRequestAnnotation,
  localField: '_id',
  foreignField: 'targetedAsset',
})

assetSchema.set('toJSON', {
  virtuals: true
})
assetSchema.plugin(MongoPaging.mongoosePlugin)

const Asset = mongoose.model<IAsset, MongooseCursorPaginationModel<IAsset, {}, {}, {
  annotationData?: IAnnotation[],
  pullRequestAnnotationData?: IAnnotation[],
}>>('Asset', assetSchema)

export default Asset
