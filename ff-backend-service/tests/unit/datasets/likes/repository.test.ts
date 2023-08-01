import '@/tests/unit/base'
import { setup, teardown } from '@/tests/unit/base'
import userFixture from '@/tests/unit/users/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import datasetFixture from '@/tests/unit/datasets/fixture'
import labelFixture from '@/tests/unit/labels/fixture'
import { IUser } from '@/domains/users/models/UserModel'
import { HydratedDocument } from 'mongoose'
import { IRecipe } from '@/domains/recipes/model'
import { ILabel } from '@/domains/labels/model'
import { IDataset } from '@/domains/datasets/model'
import DatasetLikeRepository from '@/domains/datasets/like/repository'
import DatasetRepository from '@/domains/datasets/repository'
import * as console from 'console'

const datasetLikesRepo = new DatasetLikeRepository()
const datasetRepo = new DatasetRepository()

describe('datasetLikesRepository', () => {
  let testUsers: IUser[]
  let testRecipes: HydratedDocument<IRecipe>[]
  let testLabels: HydratedDocument<ILabel>[]
  let testDatasets: HydratedDocument<IDataset>[]
  const users: {
    blockedUser: IUser,
    contributorUser: IUser,
    adminUser: IUser,
    ownerUser: IUser,
    normalUser: IUser,
  } = {} as any
  beforeAll(async () => {
    await setup()
    testUsers = await userFixture()
    testRecipes = await recipeFixture()
    testLabels = await labelFixture()
    testDatasets = (await datasetFixture()).imageDatasets
  })
  afterAll(async () => {
    await teardown()
  })
  test('Like the dataset - increments the like count of the dataset.', async () => {
    await datasetLikesRepo.likeDataset(testDatasets[0], testUsers[0])

    expect(await datasetLikesRepo.checkIfDatasetLiked(testDatasets[0], testUsers[0])).toEqual(true)
    expect(await datasetLikesRepo.getLikeCountOfDataset(testDatasets[0])).toEqual(1)
  })
  test('Like the dataset again - will not increment.', async () => {
    await datasetLikesRepo.likeDataset(testDatasets[0], testUsers[0])

    expect(await datasetLikesRepo.checkIfDatasetLiked(testDatasets[0], testUsers[0])).toEqual(true)
    expect(await datasetLikesRepo.getLikeCountOfDataset(testDatasets[0])).toEqual(1)
  })
  test('Unlike the dataset - decrements the like count.', async () => {
    await datasetLikesRepo.unlikeDataset(testDatasets[0], testUsers[0])

    expect(await datasetLikesRepo.checkIfDatasetLiked(testDatasets[0], testUsers[0])).toEqual(false)
    expect(await datasetLikesRepo.getLikeCountOfDataset(testDatasets[0])).toEqual(0)
  })
  test('Unlike the dataset again - will not decrement.', async () => {
    await datasetLikesRepo.unlikeDataset(testDatasets[0], testUsers[0])

    expect(await datasetLikesRepo.checkIfDatasetLiked(testDatasets[0], testUsers[0])).toEqual(false)
    expect(await datasetLikesRepo.getLikeCountOfDataset(testDatasets[0])).toEqual(0)
  })
  test('Like multiple datasets and perform a deep query.', async () => {
    const promises: Promise<void>[] = []
    const likes: Record<string, number> = {}

    for (let dataset of testDatasets) {
      likes[dataset._id.toString()] = Math.floor(Math.random() * 12)
      for (let i = 0; i < likes[dataset._id.toString()]; i++) {
        promises.push(datasetLikesRepo.likeDataset(dataset, testUsers[i]))
      }
    }

    await Promise.all(promises)

    const datasetsWithLikes = await datasetRepo.expandDatasetObjects(testDatasets, {
      expand: ['likes', 'assetCounts'],
      user: testUsers[0],
    })
    for (let datasetWithLikes of datasetsWithLikes) {
      expect(datasetWithLikes.likes).toEqual(likes[datasetWithLikes._id.toString()])
    }
    for (let dataset of testDatasets) {
      expect((dataset as any).likes).toBe(undefined)
    }
  })
  test('Search datasets by like count.', async () => {
    const page = await datasetRepo.searchDatasets({
      sort: {
        field: "likes"
      },
      pagination: {
        limit: 5,
      }
    });
    const expanded = await datasetRepo.expandDatasetObjects(page.data, {
      user: testUsers[0],
      expand: ["likes"]
    });
    expect(expanded.map(i => i.likes)).toEqual(expanded.map(i => i.likes).sort((x, y) => y! - x!));
  })
})