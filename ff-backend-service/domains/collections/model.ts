import { ObjectId } from '@/utils/abbreviations'
import mongoose, { HydratedDocument } from 'mongoose'
import Dataset, { IPreviewAsset } from '../datasets/model'
import User from '@/domains/users/models/UserModel'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import Asset from '../assets/model'
import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3'
import * as config from '@/utils/config'
import { MODEL_NAMES } from '@/configuration'

const Schema = mongoose.Schema
const s3 = new S3Client(config.S3_CONFIG)

async function clone (sourceId: ObjectId, destinationId: ObjectId) {
  await s3.send(new CopyObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    CopySource: `${process.env.BUCKET_NAME}/${sourceId.toString()}`,
    Key: destinationId.toString(),
  }))
}

export interface ICollectionMetrics {
  views: number;
}

export interface ICollection {
  _id: ObjectId;
  //Description of Dataset
  name: string;
  user: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  datasets: mongoose.Types.ObjectId[];
  public: boolean;
  thumbnail?: IPreviewAsset;
  icon?: IPreviewAsset;
  metrics: ICollectionMetrics;
}

const PreviewAssetSchema = new Schema<IPreviewAsset>({
  assetKey: {
    type: String,
    required: true,
  },
  url: {
    type: String,
  }
})

const CollectionsMetricsSchema = new Schema<ICollectionMetrics>({
  views: {
    type: Number,
    default: 0,
    required: true,
  }
})

const CollectionSchema = new Schema<ICollection>({
  name: {
    type: String,
    required: [true, 'Unique name not specified'],
    index: 'text'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName
  },
  description: String,
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
  tags: {
    type: [String],
    required: true,
    default: () => []
  },
  datasets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: Dataset
  }],
  public: {
    type: Boolean,
    required: true,
    default: false,
  },
  thumbnail: {
    type: PreviewAssetSchema
  },
  icon: {
    type: PreviewAssetSchema
  },
  metrics: {
    type: CollectionsMetricsSchema,
    required: true,
    default: () => ({}),
  }
})

CollectionSchema.set('toJSON', {
  virtuals: true,
})

CollectionSchema.plugin(MongoPaging.mongoosePlugin)

const Collection = mongoose.model<ICollection, MongooseCursorPaginationModel<ICollection>>(MODEL_NAMES.collection, CollectionSchema, undefined)

export default Collection
