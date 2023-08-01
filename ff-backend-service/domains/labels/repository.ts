import Label, { AnnotationTool, ILabel } from '@/domains/labels/model'
import mongoose, { HydratedDocument } from 'mongoose'
import { AlreadyExistsError, ImmutableResourceError, NotFoundError, UserMismatchError } from '@/utils/errors'
import Recipe, { IRecipe } from '@/domains/recipes/model'
import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import * as console from 'console'
import { ObjectId } from '@/utils/abbreviations'

export type PopulatedLabel = Awaited<ReturnType<typeof LabelRepository.prototype.getLabelById>>;

export default class LabelRepository extends AbstractRepository {
  async createLabel (recipe: HydratedDocument<IRecipe>, data: Partial<ILabel>): Promise<HydratedDocument<ILabel>> {
    if (recipe.immutable) {
      throw new ImmutableResourceError('The recipe is locked - no labels can be added at this point.')
    }
    const createData = {
      ...data,
      recipe: recipe._id,
    }
    const existingLabel = await Label.findOne({
      recipe: recipe._id,
      name: data.name,
      tool: data.tool,
    })
    if (existingLabel) {
      throw new AlreadyExistsError('The label has already existed.')
    }
    return await new Label(createData).save()
  }

  async getLabelById (id: mongoose.Types.ObjectId) {
    const label = await Label.findById(id).populate<{ recipe: IRecipe }>('recipe')
    if (!label) {
      throw new NotFoundError('Label not found.')
    }
    return label
  }

  async getLabelsByRecipe (recipe: HydratedDocument<IRecipe>): Promise<HydratedDocument<ILabel>[]> {
    return Label.find({
      recipe: recipe._id,
    })
  }

  async getLabelsByRecipes<T extends IRecipe>(recipes: T[]) {
    const recipeIds = recipes.map(doc => doc._id)
    const idSet = new Set<string>(recipeIds.map(id => id.toString()))
    const output: {
      recipe: ObjectId,
      labels: ILabel[],
    }[] = await Label.aggregate([
      {
        $match: {
          recipe: {
            $in: recipeIds,
          }
        },
      },
      {
        $group: {
          _id: "$recipe",
          labels: {
            $push: "$$ROOT",
          }
        }
      },
      {
        $project: {
          _id: 0,
          recipe: "$_id",
          labels: 1,
        }
      }
    ]);
    for (let found of output) {
      idSet.delete(found.recipe.toString());
    }
    for (let notFoundId of idSet) {
      output.push({
        recipe: new ObjectId(notFoundId),
        labels: []
      })
    }
    return output;
  }

  async renameLabel (label: PopulatedLabel, newName: string): Promise<void> {
    if (label.recipe.immutable) {
      throw new ImmutableResourceError('The recipe that this label belongs to has already belonged to a dataset and cannot be renamed.')
    }
    label.name = newName
    await label.save()
  }

  async changeToolOfLabel (label: PopulatedLabel, newTool: AnnotationTool): Promise<void> {
    if (label.recipe.immutable) {
      throw new ImmutableResourceError('The recipe that this label belongs to has already belonged to a dataset and cannot be bound to a new tool.')
    }
    label.tool = newTool
    await label.save()
  }

  async changeColorOfLabel (label: PopulatedLabel, newColor: string): Promise<void> {
    label.color = newColor
    await label.save()
  }

  async deleteLabel (label: PopulatedLabel): Promise<void> {
    if (label.recipe.immutable) {
      throw new ImmutableResourceError('The recipe that this label belongs to has already belonged to a dataset and cannot be removed.')
    }
    await label.deleteOne()
  }

  verifyLabelOwner (label: PopulatedLabel, user: Express.User) {
    if (!label.recipe.user.equals(user._id)) {
      throw new UserMismatchError('You do not own this label.')
    }
  }
}

