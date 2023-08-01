import mongoose, { HydratedDocument } from 'mongoose'
import Dataset from '@/domains/datasets/model'
import User from '@/domains/users/models/UserModel'
import { MODEL_NAMES } from '@/configuration'

const Schema = mongoose.Schema

export interface IDatasetLike {
  dataset: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date
}

const datasetLikeSchema = new Schema<IDatasetLike>({
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Dataset.modelName,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName,
  },
  createdAt: {
    type: Date
  }
})

datasetLikeSchema.set('toJSON', {
  virtuals: true,
})

datasetLikeSchema.pre('save', function (this: HydratedDocument<IDatasetLike>, next) {
  if (!this.createdAt) {
    this.createdAt = new Date()
  }
  next()
})

datasetLikeSchema.index({ dataset: 1, user: 1}, { unique: true });

const DatasetLike = mongoose.model<IDatasetLike>(MODEL_NAMES.datasetLike, datasetLikeSchema)
export default DatasetLike
