import { ObjectId } from '@/utils/abbreviations'
import mongoose, { HydratedDocument } from 'mongoose'
import { MODEL_NAMES } from '@/configuration'
import Dataset from '@/domains/datasets/model'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'

export interface ICollectionItem {
  collection: ObjectId;
  dataset: ObjectId;
}

const CollectionItemSchema = new mongoose.Schema<ICollectionItem>({
  dataset: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: MODEL_NAMES.dataset,
    validate: async function (dataset: ObjectId) {
      const fetchedDataset = await Dataset.findOne(dataset._id)
      if (!fetchedDataset) {
        throw new Error('Dataset not found.')
      }
      return true
    },
  },
  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.collection,
    required: true,
  }
})
CollectionItemSchema.plugin(MongoPaging.mongoosePlugin)

const CollectionItem = mongoose.model<ICollectionItem, MongooseCursorPaginationModel<ICollectionItem>>(MODEL_NAMES.collectionItem, CollectionItemSchema);

export default CollectionItem;
