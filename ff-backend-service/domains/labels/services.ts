import LabelRepository from './repository'
import RecipeRepository from '@/domains/recipes/repository'
import { PopulatedLabel } from './repository'
import { HydratedDocument } from 'mongoose'
import { AnnotationTool, ILabel } from '@/domains/labels/model'
import { IRecipe } from '@/domains/recipes/model'
import ExposedServices from '@/utils/artifacts/AbstractService'
import { ObjectId } from '@/utils/abbreviations'

export default class LabelServices extends ExposedServices {

  recipeRepo = new RecipeRepository()
  repo = new LabelRepository()

  async createLabel (recipeId: ObjectId, parameters: {
    name: string,
    tool: AnnotationTool,
    color: string,
  }): Promise<HydratedDocument<ILabel>> {
    const recipe: HydratedDocument<IRecipe> = await this.recipeRepo.getRecipeById(recipeId)
    await this.recipeRepo.verifyRecipeOwner(recipe, this.user)
    return await this.repo.createLabel(recipe, {
      name: parameters.name,
      color: parameters.color,
      tool: parameters.tool,
    })
  }

  async getLabelById (id: ObjectId): Promise<PopulatedLabel> {
    const label = await this.repo.getLabelById(id)
    this.repo.verifyLabelOwner(label, this.user)
    return label
  }

  async getLabelsByRecipeId (id: ObjectId): Promise<HydratedDocument<ILabel>[]> {
    const recipe = await this.recipeRepo.getRecipeById(id)
    await this.recipeRepo.verifyRecipeOwner(recipe, this.user)
    return await this.repo.getLabelsByRecipe(recipe)
  }

  async deleteLabel (id: ObjectId) {
    const label = await this.repo.getLabelById(id)
    this.repo.verifyLabelOwner(label, this.user)
    await this.repo.deleteLabel(label)
  }

  async renameLabel (id: ObjectId, newName: string) {
    const label = await this.repo.getLabelById(id)
    this.repo.verifyLabelOwner(label, this.user)
    await this.repo.renameLabel(label, newName)
  }

  async changeToolOfLabel (id: ObjectId, newTool: AnnotationTool) {
    const label = await this.repo.getLabelById(id)
    this.repo.verifyLabelOwner(label, this.user)
    await this.repo.changeToolOfLabel(label, newTool)
  }

  async changeColorOfLabel (id: ObjectId, newColor: string) {
    const label = await this.repo.getLabelById(id)
    this.repo.verifyLabelOwner(label, this.user)
    await this.repo.changeColorOfLabel(label, newColor)
  }
}

