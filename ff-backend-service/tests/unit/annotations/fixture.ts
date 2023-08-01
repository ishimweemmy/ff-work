import userFixture from '@/tests/unit/users/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import labelFixture from '@/tests/unit/labels/fixture'
import datasetFixture from '@/tests/unit/datasets/fixture'
import assetFixture from '@/tests/unit/assets/fixture'
import AnnotationRepository from '@/domains/annotations/repository'
import { HydratedDocument } from 'mongoose'
import { IAnnotation } from '@/domains/annotations/model'
import lodash from 'lodash'
import Label, { ANNOTATION_TOOL_ENUM } from '@/domains/labels/model'
import { generateAnnotationData } from '@/tests/unit/annotations/generate'
import AssetRepository from '@/domains/assets/repository'
import cachedFixture from '@/tests/unit/fixture'

const annotationRepo = new AnnotationRepository()
const assetRepo = new AssetRepository()

async function _annotationFixture () {
  await userFixture()
  await recipeFixture()
  await labelFixture()
  await datasetFixture()
  const testAssets = (await assetFixture()).images
  const testAnnotations: HydratedDocument<IAnnotation>[] = []
  for (let assetCollection of testAssets) {
    for (let asset of assetCollection) {
      const testAsset = await assetRepo.getAssetById(asset._id)
      for (let i = 0; i < 10; i++) {
        const annotationType = lodash.sample(ANNOTATION_TOOL_ENUM._def.values)!
        const label = await Label.findOne({
          recipe: testAsset.dataset.recipe,
          tool: annotationType,
        })
        if (!label) {
          throw new Error('Label missing - abort test.')
        }
        const generated = generateAnnotationData(annotationType)
        testAnnotations.push(await annotationRepo.createAnnotation(testAsset, {
          label: label._id,
          data: generated as any,
        }))
      }
    }
  }
  return testAnnotations
}

const annotationFixture = cachedFixture(_annotationFixture)
export default annotationFixture