import { setup, teardown } from '@/tests/unit/base'
import labelFixture from '@/tests/unit/labels/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import userFixture from '@/tests/unit/users/fixture'
import User, { IUser } from '@/domains/users/models/UserModel'
import mongoose, { HydratedDocument } from 'mongoose'
import { IRecipe } from '@/domains/recipes/model'
import { ILabel } from '@/domains/labels/model'
import { IDataset } from '@/domains/datasets/model'
import DatasetRepository from '@/domains/datasets/repository'
import { ObjectId } from '@/utils/abbreviations'
import RecipeRepository from '@/domains/recipes/repository'
import { ImmutableResourceError, NotFoundError, UserMismatchError } from '@/utils/errors'
import LabelRepository from '@/domains/labels/repository'
import delay from '@/utils/delay'
import lodash from 'lodash'
import { fakerEN } from '@faker-js/faker'
import { string } from 'zod'
import stripe from '@/domains/payments/stripe'
import Stripe from 'stripe'

const datasetRepo = new DatasetRepository()
const recipeRepo = new RecipeRepository()
const labelRepo = new LabelRepository()

describe('datasetRepository', () => {
  let testUser: IUser
  let testUsers: IUser[]
  let testRecipe: HydratedDocument<IRecipe>
  let testLabels: HydratedDocument<ILabel>[]
  let currentDataset: HydratedDocument<IDataset>
  beforeAll(async () => {
    await setup()
    testUser = (await userFixture())[0]
    testUsers = await userFixture()
    testRecipe = (await recipeFixture())[0]
    testLabels = await labelFixture()
  })
  afterAll(async () => {
    await teardown()
  })
  test('Create a dataset', async () => {
    currentDataset = await datasetRepo.createDataset({
      recipe: testRecipe,
    }, {
      name: 'Test dataset',
      user: testUser._id,
      tags: ['Images', 'Segmentation'],
      type: 'image',
      classSearchQueries: new mongoose.Types.Map([
        ['dog', [...new Set(Array.from({ length: 10 }, fakerEN.animal.dog))]],
      ]),
    })
    expect(currentDataset._id).toBeInstanceOf(ObjectId)
    expect(currentDataset.name).toEqual('Test dataset')
    expect(currentDataset.tags).toEqual(['Images', 'Segmentation'])
    expect(currentDataset.subTags).toEqual([])
    expect(currentDataset.type).toEqual('image')
    expect(currentDataset.classSearchQueries.get('dog')).toBeInstanceOf(Array)
  })
  test('Immutable recipe after dataset creation.', async () => {
    const targetRecipe = await recipeRepo.getRecipeById(testRecipe._id)
    await expect(recipeRepo.deleteRecipe(targetRecipe)).rejects.toBeInstanceOf(ImmutableResourceError)
    await expect(labelRepo.createLabel(targetRecipe, {
      name: 'This label is supposed to be blocked!',
    })).rejects.toBeInstanceOf(ImmutableResourceError)
    const targetLabel = await labelRepo.getLabelById(testLabels[0]._id)
    await expect(labelRepo.renameLabel(targetLabel, 'This label is supposed to be blocked!'))
      .rejects.toBeInstanceOf(ImmutableResourceError)
  })
  test('Get dataset by ID', async () => {
    const targetDataset = await datasetRepo.getDatasetById(currentDataset._id)
    expect(targetDataset.name).toEqual('Test dataset')
  })
  test('Edit a dataset', async () => {
    let targeted = await datasetRepo.getDatasetById(currentDataset._id)
    await datasetRepo.editDataset(targeted, {
      name: 'Test dataset 2',
      tags: ['Images'],
      description: 'new dataset here.',
    })

    expect(targeted._id).toBeInstanceOf(ObjectId)
    expect(targeted.name).toEqual('Test dataset 2')
    expect(targeted.tags).toEqual(['Images'])
    expect(targeted.description).toEqual('new dataset here.')
    expect(targeted.subTags).toEqual([])
    expect(targeted.type).toEqual('image')
    expect(targeted.classSearchQueries.get('dog')).toBeInstanceOf(Array)

    await datasetRepo.editDataset(targeted, {
      subTags: ['Dog'],
    })

    let targeted2 = await datasetRepo.getDatasetById(currentDataset._id)
    expect(targeted2.name).toEqual('Test dataset 2')
    expect(targeted2.tags).toEqual(['Images'])
    expect(targeted2.subTags).toEqual(['Dog'])
    expect(targeted2.description).toEqual('new dataset here.')

  })
  test('Create multiple datasets', async () => {
    const promises = []
    await delay(1)
    for (let i = 0; i < 15; i++) {
      promises.push(datasetRepo.createDataset({
        recipe: testRecipe,
      }, {
        name: `Dataset ${lodash.sample(['dog', 'cat'])} ${i}`,
        user: testUser._id,
        tags: ['Images', 'Segmentation'],
        type: 'image',
        classSearchQueries: new mongoose.Types.Map([
          ['dog', [...new Set(Array.from({ length: 10 }, fakerEN.animal.dog))]],
        ]),
      }))
    }
    await Promise.all(promises)
  })
  test('Change visibility', async () => {
    const targetDataset = await datasetRepo.getDatasetById(currentDataset._id)
    await datasetRepo.changeDatasetPublicVisibility(targetDataset, true)

    const changedDataset = await datasetRepo.getDatasetById(currentDataset._id)
    expect(changedDataset.public).toEqual(true)

    await datasetRepo.changeDatasetPublicVisibility(targetDataset, false)
    const changedDatasetV2 = await datasetRepo.getDatasetById(currentDataset._id)
    expect(changedDatasetV2.public).toEqual(false)
  })
  test('Change prices', async () => {
    const targetDataset = await datasetRepo.getDatasetById(currentDataset._id)
    await expect(datasetRepo.changeDatasetPrice(targetDataset, -5.99)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
    await datasetRepo.changeDatasetPrice(targetDataset, 5.99)
    const changedDatasetV2 = await datasetRepo.getDatasetById(currentDataset._id)
    expect(changedDatasetV2.price).toEqual(5.99)
  })
  test('Change ownership', async () => {
    const targetDataset = await datasetRepo.getDatasetById(currentDataset._id)
    await datasetRepo.transferDatasetOwnership(targetDataset, testUsers[1])

    const retrievedDataset = await datasetRepo.getDatasetById(currentDataset._id)
    expect(retrievedDataset.user._id.toString()).toEqual(testUsers[1]._id.toString())
  })
  test('Search datasets', async () => {
    let nextId: string | undefined = undefined
    const matchedDatasets = await datasetRepo.searchDatasets({
      name: 'dog',
      user: testUser._id,
      pagination: {
        limit: Infinity,
      }
    })
    const matchedDatasetIds = matchedDatasets.data.map(recipe => recipe._id.toString())
    const paginatedMatchedDatasets: IDataset[] = []
    do {
      const searchedRecipes = await datasetRepo.searchDatasets({
        name: 'dog',
        user: testUser._id,
        pagination: {
          next: nextId,
          limit: 3,
        }
      })
      paginatedMatchedDatasets.push(...searchedRecipes.data)
      nextId = searchedRecipes.meta.next
    } while (nextId)
    const paginatedMatchedDatasetIds = paginatedMatchedDatasets.map(recipe => recipe._id.toString())
    let passed = true
    for (let recipe of paginatedMatchedDatasets) {
      if (!recipe.name.includes('dog')) {
        passed = false
      }
    }
    expect(passed).toBeTruthy()
    expect(paginatedMatchedDatasetIds).toEqual(matchedDatasetIds)
  })
  test('Verify dataset owner', async () => {
    await expect(async () => datasetRepo.verifyDatasetOwner(currentDataset, testUser)).resolves
  })
  test('Verify that non-owners cannot access.', async () => {
    const alienUser = await User.findOne({
      _id: {
        $ne: testUser._id,
      }
    })
    if (!alienUser) {
      throw new Error('No non-owning user found - aborting.')
    }
    expect(() => datasetRepo.verifyDatasetOwner(currentDataset, alienUser)).toThrowError(UserMismatchError)
  })
  test('Delete the dataset.', async () => {
    const prevId = currentDataset._id
    await datasetRepo.removeDataset(currentDataset)
    await expect(datasetRepo.getDatasetById(prevId)).rejects.toBeInstanceOf(NotFoundError)
  })
})
