import { IRecipe } from './model'
import RecipeRepository, { SearchQuery } from './repository'
import ExposedService from '@/utils/artifacts/AbstractService'
import { ObjectId } from '@/utils/abbreviations'
import LabelRepository from '@/domains/labels/repository'
import { ILabel } from '@/domains/labels/model'
import { expandCollectionAndMergeFields, expandCollectionIntoOneField } from '@/utils/repoUtils'

export default class RecipeService extends ExposedService {
  repo = new RecipeRepository()
  labelRepo = new LabelRepository()

  async createRecipe (recipe: Partial<IRecipe>) {
    return await this.repo.createRecipe({
      ...recipe,
      user: this.user._id,
    })
  }

  async getRecipeById (id: ObjectId, query: {
    expand: string[]
  }) {
    const recipe = await this.repo.getRecipeById(id)
    this.repo.verifyRecipeOwner(recipe, this.user)
    const obj = recipe.toObject<IRecipe & {
      labels?: ILabel[],
    }>()
    if (query.expand.includes('labels')) {
      const labels = await this.labelRepo.getLabelsByRecipe(recipe)
      obj.labels = labels.map(label => label.toObject())
    }
    return obj
  }

  async searchRecipes (query: SearchQuery & {
    expand: string[]
  }) {
    let queryResult = await this.repo.searchRecipes({
      ...query,
      user: this.user._id,
    })
    let result: (IRecipe & {
      labels?: ILabel[]
    })[] = queryResult.data
    if (query.expand.includes('labels')) {
      let labelQueryResult = await this.labelRepo.getLabelsByRecipes(result)
      result = expandCollectionAndMergeFields({
        localCollection: result,
        foreignCollection: labelQueryResult,
        foreignKey: 'recipe',
        localKey: '_id'
      })
    }
    return {
      ...queryResult,
      data: result,
    }
  }

  async deleteRecipe (id: ObjectId) {
    const recipe = await this.repo.getRecipeById(id)
    this.repo.verifyRecipeOwner(recipe, this.user)
    await this.repo.deleteRecipe(recipe)
  }

  async renameRecipe (id: ObjectId, newName: string) {
    const recipe = await this.repo.getRecipeById(id)
    await this.repo.verifyRecipeOwner(recipe, this.user)
    await this.repo.renameRecipe(recipe, newName)
  }
}