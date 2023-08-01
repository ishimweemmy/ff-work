import mongoose, { HydratedDocument } from 'mongoose'
import z from 'zod'
import Dataset from '@/domains/datasets/model'
import User from '@/domains/users/models/UserModel'
import { ObjectId } from '@/utils/abbreviations'
import { MODEL_NAMES } from '@/configuration'
import { MongoBinary } from 'mongodb-memory-server-core'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'

export const DATASET_ROLE_ENUM = z.enum([
  'admin',
  'maintainer',
  'blocked',
  'none',
  'contributor',
  'preview',
  'owner',
])
export type DatasetRole = z.infer<typeof DATASET_ROLE_ENUM>
export const STORABLE_DATASET_ROLES: DatasetRole[] = [
  'admin',
  'contributor',
  'maintainer',
  'blocked',
]
export const DATASET_ROLE_HIERARCHY: DatasetRole[] = [
  'preview',
  'contributor',
  'maintainer',
  'admin',
  'owner',
]

export interface IDatasetPermission {
  _id: ObjectId;
  dataset: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: DatasetRole;
  purchased: boolean;
  purchasedAt?: Date;
}

const DatasetPermissionSchema = new mongoose.Schema<IDatasetPermission>({
  dataset: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Dataset.modelName,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName,
    required: true,
  },
  role: {
    type: String,
    enum: STORABLE_DATASET_ROLES,
    required: true,
  },
  purchased: {
    type: Boolean,
    required: true,
    default: false,
  },
  purchasedAt: {
    type: Date,
  }
})

DatasetPermissionSchema.pre('save', function (this: HydratedDocument<IDatasetPermission>, next) {
  if (this.purchased && !this.purchasedAt) {
    this.purchasedAt = new Date()
  }
  next()
})

DatasetPermissionSchema.plugin(MongoPaging.mongoosePlugin)
const DatasetPermission = mongoose.model<IDatasetPermission, MongooseCursorPaginationModel<IDatasetPermission>>(MODEL_NAMES.datasetPermission, DatasetPermissionSchema)

export default DatasetPermission
