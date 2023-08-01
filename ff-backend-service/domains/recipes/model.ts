import mongoose from 'mongoose'
import User from '@/domains/users/models/UserModel'
import Dataset from '@/domains/datasets/model'
import MongoPaging, { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'

export interface IRecipe {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  // A recipe becomes immutable and cannot be deleted if it has already been used by datasets.
  immutable: boolean;
  name: string;
  createdAt: Date;
}

const RecipeSchema = new mongoose.Schema<IRecipe>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName,
    required: true,
  },
  immutable: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date(),
  },
  name: {
    type: String,
    required: true,
    index: 'text',
  },
})

RecipeSchema.plugin(MongoPaging.mongoosePlugin)

const Recipe = mongoose.model<IRecipe, MongooseCursorPaginationModel<IRecipe>>('Recipe', RecipeSchema)
Recipe.ensureIndexes().then()

export default Recipe