import mongoose, { HydratedDocument, pluralize } from 'mongoose'
import User from '@/domains/users/models/UserModel'
import Recipe from '@/domains/recipes/model'
import { ObjectId } from '@/utils/abbreviations'
import stripe from '@/domains/payments/stripe'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import { MODEL_NAMES } from '@/configuration'
import Asset from '@/domains/assets/model'
import * as config from '@/utils/config'
import { CopyObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { SUPPORTED_ASSET_TYPE_ENUM } from '@/domains/assets/enums'
import { ACTIVITY_TYPE_ENUM } from './metrics/enums'
import { cloneObject, getObject, getPublicUrl } from '@/services/bucketService'
import { randomUUID } from 'crypto'
import { DATASET_LICENSE_ENUM } from '@/domains/datasets/enums'

const Schema = mongoose.Schema

export interface IPreviewAsset {
  url: string;
  assetKey: string;
}

export interface IAllTimeMetrics {
  downloads: number
  views: number
}

export interface IDataset {
  _id: ObjectId;
  name: string;
  user: mongoose.Types.ObjectId;
  type: Flockfysh.SupportedAssetType;
  createdAt: Date;
  updatedAt: Date;

  tags: string[];
  subTags: string[];
  recipe: mongoose.Types.ObjectId;
  description?: string;
  thumbnail?: IPreviewAsset;
  icon?: IPreviewAsset;

  metrics: IAllTimeMetrics,
  // Payment information.
  subscriptionId?: string;
  subscriptionItemIds?: {
    totalStorageUsed: string;
    totalComputationEpochs: string;
  };
  subscriptionActive: boolean;
  subscriptionUnusable: boolean;

  // Configuration, immutable.
  classSearchQueries: mongoose.Types.Map<string[]>;
  stage: 'untrained' | 'feedback' | 'completed';
  desiredDatasetSize: number;

  // Internal state for the cluster to track the dataset's progress and size. Updated by the cluster.
  jobName?: string;
  numTimesHumanFeedback: number;
  taskId?: string;
  taskQueue?: string;
  taskInProgress: boolean;
  sizeOnCluster: number;
  computationEpochs: number;

  public: boolean;
  price: number;
  license: Flockfysh.DatasetLicense;
}

const AllTimeMetricSchema = new Schema<IAllTimeMetrics>({
  downloads: {
    type: Number,
    default: 0,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
    required: true,
  }
})

const PreviewAssetSchema = new Schema<IPreviewAsset>({
  assetKey: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  }
})

const DatasetSchema = new Schema<IDataset, any, {}, {}, {
  likes?: number,
  bookmarks?: number
}>({
  name: {
    type: String,
    required: [true, 'Unique name not specified'],
    index: 'text',
  },
  type: {
    type: String,
    enum: SUPPORTED_ASSET_TYPE_ENUM._def.values,
    required: [true, 'Dataset type not specified'],
  },
  tags: {
    type: [String],
    default: () => [],
    required: true,
  },
  subTags: {
    type: [String],
    default: () => [],
    required: true,
  },
  icon: {
    type: PreviewAssetSchema,
  },
  thumbnail: {
    type: PreviewAssetSchema,
  },
  classSearchQueries: {
    type: mongoose.Schema.Types.Map,
    of: {
      type: [String],
      default: () => [],
    },
    required: true,
    default: () => {
      return new mongoose.Types.Map()
    },
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  updatedAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  jobName: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName,
    required: [true, 'A dataset must be owned by an user.'],
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Recipe.modelName,
    required: true,
  },
  metrics: {
    type: AllTimeMetricSchema,
    default: () => ({}),
    required: true
  },
  subscriptionId: {
    type: String,
  },
  subscriptionItemIds: {
    type: {
      totalStorageUsed: {
        type: String,
        required: true,
      },
      totalComputationEpochs: {
        type: String,
        required: true,
      },
    },
  },
  subscriptionActive: {
    type: Boolean,
    required: true,
    default: false,
  },
  subscriptionUnusable: {
    type: Boolean,
    required: true,
    default: false,
  },
  description: String,
  numTimesHumanFeedback: {
    type: Number,
    required: true,
    default: 0,
  },
  stage: {
    type: String,
    default: 'untrained',
    enum: ['untrained', 'feedback', 'completed'],
  },
  desiredDatasetSize: {
    type: Number,
  },
  taskQueue: {
    type: String,
  },
  taskId: {
    type: String,
  },
  taskInProgress: {
    type: Boolean,
    required: true,
    default: false,
  },
  sizeOnCluster: {
    type: Number,
    default: 0,
    required: true,
  },
  computationEpochs: {
    type: Number,
    default: 0,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
    required: true,
    set: function (this: HydratedDocument<IDataset>, value: number) {
      this.$locals._prevPrice = this.price
      return value
    },
  },
  public: {
    type: Boolean,
    default: false,
    required: true,
  },
  license: {
    type: String,
    default: 'none',
    required: true,
    enum: DATASET_LICENSE_ENUM._def.values,
  },
})

DatasetSchema.set('toJSON', {
  virtuals: true,
})

DatasetSchema.plugin(MongoPaging.mongoosePlugin)

DatasetSchema.pre('validate', async function (this: HydratedDocument<IDataset>, next) {
  if (this.thumbnail) {
    return next()
  }
  const assetCount = await Asset.find({
    dataset: this._id,
    type: 'image',
  }).count()
  const randomSkipOffset = Math.floor(Math.random() * assetCount)
  const sample = await Asset.findOne({
    dataset: this._id,
    type: 'image',
  }).skip(randomSkipOffset)
  if (sample) {
    const newAssetKey = `datasetsThumbnails/${randomUUID()}`
    await cloneObject(undefined, sample._id.toString(), newAssetKey, {
      ACL: 'public-read'
    })
    this.thumbnail = {
      assetKey: newAssetKey,
      url: await getPublicUrl(undefined, newAssetKey),
    }
  }
  next()
})

DatasetSchema.virtual('likes', {
  ref: MODEL_NAMES.datasetLike,
  count: true,
  localField: '_id',
  foreignField: 'dataset',
})

DatasetSchema.virtual('bookmark', {
  ref: MODEL_NAMES.datasetBookmark,
  count: true,
  localField: '_id',
  foreignField: 'dataset'
})

DatasetSchema.virtual('contributors', {
  ref: MODEL_NAMES.datasetPermission,
  count: true,
  localField: '_id',
  foreignField: 'dataset',
  match: {
    role: {
      $in: ['contributor', 'admin'],
    }
  }
})

const Dataset = mongoose.model<IDataset, MongooseCursorPaginationModel<IDataset, {}, {}, {
  likes?: number,
  bookmarks?: number,
}>>('Dataset', DatasetSchema, undefined)

function enablePreImage () {
  const connection = mongoose.connection
  connection.once('open', async function () {
    await connection.db.command({
      collMod: Dataset.collection.collectionName,
      changeStreamPreAndPostImages: {
        enabled: true,
      },
    })
  })
}

enablePreImage()

export default Dataset
