import { setup, teardown } from '@/tests/unit/base'
import LabelRepository from '@/domains/labels/repository'
import { ObjectId } from '@/utils/abbreviations'
import Recipe, { IRecipe } from '@/domains/recipes/model'
import { HydratedDocument } from 'mongoose'
import { v4 } from 'uuid'
import { AlreadyExistsError, ImmutableResourceError, NotFoundError } from '@/utils/errors'
import { fakerEN } from '@faker-js/faker'
import User, { IUser } from '@/domains/users/models/UserModel'
import RecipeRepository from '@/domains/recipes/repository'
import recipeFixture from '@/tests/unit/recipes/fixture'
import userFixture from '@/tests/unit/users/fixture'
import Label, { ANNOTATION_TOOL_ENUM } from '@/domains/labels/model'
import lodash from 'lodash'
import dataset from '@/routes/microservices/dataset'
import RecipeService from '@/domains/recipes/service'
import * as console from 'console'

let labelRepo = new LabelRepository()
let recipeRepo = new RecipeRepository()

describe('labelRepository', () => {
  let firstRecipe: HydratedDocument<IRecipe>
  let testRecipes: HydratedDocument<IRecipe>[]
  let testUser: IUser
  let labelId: ObjectId
  let secondRecipe: HydratedDocument<IRecipe>
  const newLabelName = `Label ${v4()}`
  const tool = lodash.sample(ANNOTATION_TOOL_ENUM._def.values)
  const color = fakerEN.color.rgb()
  const initialConfig = {
    name: newLabelName,
    tool: tool,
    color: color,
  }
  beforeAll(async () => {
    await setup()
    testUser = (await userFixture())[0]
    firstRecipe = (await recipeFixture())[0]
    testRecipes = await recipeFixture()
  })
  afterAll(async () => {
    await teardown()
  })
  test('Create a label', async () => {
    const newLabel = await labelRepo.createLabel(firstRecipe, initialConfig)
    expect(newLabel._id).toBeInstanceOf(ObjectId)
    expect(newLabel.name).toEqual(newLabelName)
    expect(newLabel.tool).toEqual(tool)
    expect(newLabel.color).toEqual(color)
    expect(newLabel.tag).toBeTruthy()
    labelId = newLabel._id
  })
  test('Labels with duplicate configurations cannot be created', async () => {
    const promise = labelRepo.createLabel(firstRecipe, {
      name: initialConfig.name,
      tool: initialConfig.tool,
      color: fakerEN.color.rgb(),
    })
    await expect(promise).rejects.toBeInstanceOf(AlreadyExistsError)
  })
  test('Get label by ID', async () => {
    const label = await labelRepo.getLabelById(labelId)
    expect(label.recipe._id).toBeInstanceOf(ObjectId)
    expect(label.name).toEqual(newLabelName)
    expect(label.recipe.name).toEqual(firstRecipe.name)
  })
  test('Create multiple labels', async () => {
    let names = new Set<string>()
    for (null; names.size < 20;) {
      names.add(fakerEN.animal.dog())
    }
    const _secondRecipe = await Recipe.findOne({
      _id: {
        $ne: firstRecipe._id
      },
    })
    if (!_secondRecipe) {
      throw new Error('Secondary recipe not found - aborted.')
    }
    secondRecipe = _secondRecipe
    secondRecipe.immutable = false
    await secondRecipe.save()
    for (let name of names) {
      await labelRepo.createLabel(firstRecipe, {
        name,
        tool: lodash.sample(ANNOTATION_TOOL_ENUM._def.values),
        color: fakerEN.color.rgb(),
      })
      await labelRepo.createLabel(secondRecipe, {
        name,
        tool: lodash.sample(ANNOTATION_TOOL_ENUM._def.values),
        color: fakerEN.color.rgb(),
      })
    }
  })
  test('Get label by label ID', async () => {
    const label = await labelRepo.getLabelById(labelId)
    expect(label.recipe._id).toBeInstanceOf(ObjectId)
    expect(label.name).toEqual(newLabelName)
    expect(label.recipe.name).toEqual(firstRecipe.name)
  })
  test('Get labels by recipe', async () => {
    const labels = await labelRepo.getLabelsByRecipe(firstRecipe)
    for (let label of labels) {
      expect(label.name).toBeTruthy()
      expect(label._id).toBeInstanceOf(ObjectId)
    }
    expect(labels.length).toEqual(21)
  })
  test('Rename a label', async () => {
    const label = await labelRepo.getLabelById(labelId)
    await labelRepo.renameLabel(label, 'new label')
    const renamedLabel = await labelRepo.getLabelById(labelId)
    expect(renamedLabel.name).toEqual('new label')
  })
  test('Change a label color', async () => {
    const label = await labelRepo.getLabelById(labelId)
    await labelRepo.changeColorOfLabel(label, '#f00')
    const renamedLabel = await labelRepo.getLabelById(labelId)
    expect(renamedLabel.color).toEqual('#f00')
  })
  test('Change a label tool', async () => {
    const label = await labelRepo.getLabelById(labelId)
    await labelRepo.changeToolOfLabel(label, 'polygon')
    const renamedLabel = await labelRepo.getLabelById(labelId)
    expect(renamedLabel.tool).toEqual('polygon')
  })
  test('Label ownership', async () => {
    const label = await labelRepo.getLabelById(labelId)
    await labelRepo.verifyLabelOwner(label, testUser)
  })
  test('Delete a label', async () => {
    const label = await labelRepo.getLabelById(labelId)
    await labelRepo.deleteLabel(label)
    await expect(labelRepo.getLabelById(labelId)).rejects.toBeInstanceOf(NotFoundError)
  })

  test('Create multiple labels (again)', async () => {
    await Label.deleteMany()
    for (let i = 0; i < 300; i++) {
      await labelRepo.createLabel(lodash.sample(testRecipes)!, {
        name: fakerEN.word.noun(),
        tool: lodash.sample(ANNOTATION_TOOL_ENUM._def.values),
        color: fakerEN.color.rgb(),
      })
    }
  })

  test('Aggregate recipes with labels', async () => {
    const result = await labelRepo.getLabelsByRecipes(testRecipes)
    expect(result.length).toEqual(testRecipes.length)
    for (let item of result) {
      expect(item.recipe).toBeInstanceOf(ObjectId)
      expect(item.labels).toBeInstanceOf(Array)
      for (let label of item.labels) {
        expect(label._id).toBeInstanceOf(ObjectId)
        expect(typeof label.tag).toBe('string')
        expect(typeof label.color).toBe('string')
        expect(typeof label.name).toBe('string')
        expect(label.recipe).toBeInstanceOf(ObjectId)
      }
    }
  })
  test('Delete a recipe causes all contained labels to be deleted, but do not affect other recipes.', async () => {
    const firstLabelsPreDelete = await labelRepo.getLabelsByRecipe(firstRecipe)
    await recipeRepo.deleteRecipe(secondRecipe)
    const firstLabelsPostDelete = await labelRepo.getLabelsByRecipe(firstRecipe)
    expect(firstLabelsPreDelete.length).toEqual(firstLabelsPostDelete.length)
    expect(firstLabelsPreDelete).toEqual(firstLabelsPostDelete)
  })
  test('Immutable recipe - now labels cannot be added, edited, or deleted.', async () => {
    const newLabel = await (await labelRepo.createLabel(firstRecipe, {
      name: newLabelName,
      tool: 'boundingBox',
      color: '#fff'
    })).populate<{ recipe: IRecipe }>('recipe')
    await recipeRepo.lockRecipe(firstRecipe)
    const searchedLabel = await labelRepo.getLabelById(newLabel._id)
    await expect(labelRepo.deleteLabel(searchedLabel)).rejects.toBeInstanceOf(ImmutableResourceError)
    await expect(labelRepo.renameLabel(searchedLabel, 'New label name')).rejects.toBeInstanceOf(ImmutableResourceError)
    await expect(labelRepo.changeToolOfLabel(searchedLabel, 'ellipse')).rejects.toBeInstanceOf(ImmutableResourceError)
    await expect(labelRepo.changeColorOfLabel(searchedLabel, '#fff')).resolves
    await expect(labelRepo.createLabel(firstRecipe, {
      name: newLabelName,
      tool: 'boundingBox',
      color: '#fff'
    })).rejects.toBeInstanceOf(ImmutableResourceError)
  })
})