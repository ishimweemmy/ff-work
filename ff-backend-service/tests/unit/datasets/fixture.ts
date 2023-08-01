import "@/tests/unit/base"
import cachedFixture from '@/tests/unit/fixture'
import { fakerEN } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'
import recipeFixture from '@/tests/unit/recipes/fixture'
import userFixture from '@/tests/unit/users/fixture'
import { IDataset } from '@/domains/datasets/model'
import DatasetRepository from '@/domains/datasets/repository'
import lodash from 'lodash'
import labelFixture from '@/tests/unit/labels/fixture'

async function _datasetFixture (): Promise<{
  imageDatasets: HydratedDocument<IDataset>[],
  miscDatasets: HydratedDocument<IDataset>[],
}> {
  const testUser = (await userFixture())[0]
  const testRecipes = await recipeFixture()
  await labelFixture()

  const imageDatasets: HydratedDocument<IDataset>[] = [];
  for (let i = 0; i < 5; i++) {
    const dataset = await new DatasetRepository().createDataset({
      recipe: testRecipes[0]
    }, {
      user: testUser._id,
      name: lodash.sample(Array.from({length: 5}, () => fakerEN.animal.dog())),
      tags: ['Images', 'Segmentation'],
      type: 'image',
    })
    imageDatasets.push(dataset)
  }

  const miscDatasets: HydratedDocument<IDataset>[] = [];
  for (let i = 0; i < 5; i++) {
    const dataset = await new DatasetRepository().createDataset({
      recipe: testRecipes[1]
    }, {
      user: testUser._id,
      name: lodash.sample(Array.from({length: 5}, () => fakerEN.animal.dog())),
      tags: ['Miscellaneous', 'Segmentation'],
      type: 'other',
    })
    miscDatasets.push(dataset)
  }

  return {
    imageDatasets,
    miscDatasets,
  };
}

const datasetFixture = cachedFixture(_datasetFixture)
export default datasetFixture