import Recipe, { IRecipe } from '@/domains/recipes/model'
import mongoose, { HydratedDocument } from 'mongoose'
import { ImmutableResourceError, NotFoundError, UserMismatchError } from '@/utils/errors'
import Label from '@/domains/labels/model'
import AbstractRepository from '@/utils/artifacts/AbstractRepository'

export interface SearchQuery {
  user?: mongoose.Types.ObjectId,
  name?: string,
  pagination?: Express.RequestPagination
}

interface InternalSearchQuery {
  $text?: {
    $search: string;
  };
  user?: mongoose.Types.ObjectId;
}

export default class RecipeRepository extends AbstractRepository {
  async createRecipe (recipe: Partial<IRecipe>): Promise<HydratedDocument<IRecipe>> {
    return await new Recipe(recipe).save()
  }

  async getRecipeById (id: mongoose.Types.ObjectId): Promise<HydratedDocument<IRecipe>> {
    const recipe = await Recipe.findById(id)
    if (!recipe) {
      throw new NotFoundError('Recipe not found.')
    }
    return recipe
  }

  async searchRecipes (query: SearchQuery) {
    let limit = query.pagination?.limit ?? 10
    const internalQuery: InternalSearchQuery = {}
    if (query.user) {
      internalQuery.user = query.user
    }
    if (query.name) {
      internalQuery.$text = {
        $search: query.name
      }
    }
    const page = await Recipe.paginate({
      query: internalQuery,
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    const {results, ...meta} = page;
    return {
      meta,
      data: results,
    }
  }

  async renameRecipe (recipe: HydratedDocument<IRecipe>, newName: string): Promise<void> {
    await recipe.updateOne({
      $set: {
        name: newName,
      }
    })
    recipe.name = newName
  }

  async lockRecipe (recipe: HydratedDocument<IRecipe>): Promise<void> {
    await recipe.updateOne({
      $set: {
        immutable: true
      }
    })
    recipe.immutable = true
  }

  async deleteRecipe (recipe: HydratedDocument<IRecipe>): Promise<void> {
    if (recipe.immutable) {
      throw new ImmutableResourceError('Recipe is already used in a dataset and therefore cannot be deleted.')
    }
    await Label.deleteMany({
      recipe: recipe._id,
    })
    await recipe.deleteOne()
  }

  verifyRecipeOwner (recipe: HydratedDocument<IRecipe>, user: Express.User) {
    if (!recipe.user.equals(user._id)) {
      throw new UserMismatchError('You do not own this recipe.')
    }
  }
}





