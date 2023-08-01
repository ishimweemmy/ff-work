import mongoose, { HydratedDocument } from "mongoose";
import Dataset from "../model";
import User from "@/domains/users/models/UserModel";
import { MODEL_NAMES } from "@/configuration";

const Schema = mongoose.Schema

export interface IDatasetBookmark {
  dataset: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date
}

const datasetBookmarkSchema = new Schema<IDatasetBookmark>({
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Dataset.modelName
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Dataset.modelName
  },
  createdAt: {
    type: Date
  }
})

datasetBookmarkSchema.set('toJSON', {
  virtuals: true,
})

datasetBookmarkSchema.pre('save', function (this: HydratedDocument<IDatasetBookmark>, next) {
  if (!this.createdAt) {
    this.createdAt = new Date()
  }
  next()
})

const DatasetBookmark = mongoose.model<IDatasetBookmark>(MODEL_NAMES.datasetBookmark, datasetBookmarkSchema)
export default DatasetBookmark
