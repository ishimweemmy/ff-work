import { setup, teardown } from '@/tests/unit/base'
import userFixture from '@/tests/unit/users/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import labelFixture from '@/tests/unit/labels/fixture'
import datasetFixture from '@/tests/unit/datasets/fixture'
import assetFixture from '@/tests/unit/assets/fixture'
import User, { IUser } from '@/domains/users/models/UserModel'
import mongoose, { HydratedDocument } from 'mongoose'
import { IRecipe } from '@/domains/recipes/model'
import Label, { ANNOTATION_TOOL_ENUM, ILabel } from '@/domains/labels/model'
import { IDataset } from '@/domains/datasets/model'
import Asset, { IAsset } from '@/domains/assets/model'
import AssetRepository, { PopulatedAsset } from '@/domains/assets/repository'
import AnnotationRepository, { PopulatedAnnotation } from '@/domains/annotations/repository'
import Annotation, { IAnnotation, IBoundingBox, IBoundingBoxData, ILineData } from '@/domains/annotations/model'
import { ObjectId } from '@/utils/abbreviations'
import lodash, { indexOf } from 'lodash'
import { NotFoundError, UserMismatchError } from '@/utils/errors'
import { generateAnnotationData } from '@/tests/unit/annotations/generate'
import DatasetRepository from '@/domains/datasets/repository'

const assetRepo = new AssetRepository()
const annotationRepo = new AnnotationRepository()
const datasetRepo = new DatasetRepository()

describe('annotationRepository', () => {
  let testUsers: IUser[]
  let testRecipes: HydratedDocument<IRecipe>[]
  let testLabels: HydratedDocument<ILabel>[]
  let testDatasets: HydratedDocument<IDataset>[]
  let testAssets: HydratedDocument<IAsset>[][]
  let testTextAssets: HydratedDocument<IAsset>[][]
  let annotationId: ObjectId

  const targetedResources: {
    populatedAsset: PopulatedAsset,
    boundingBoxLabel: HydratedDocument<ILabel>,
    lineLabel: HydratedDocument<ILabel>,
    ellipseLabel: HydratedDocument<ILabel>
  } = {} as any

  beforeAll(async () => {
    await setup()
    testUsers = await userFixture()
    testRecipes = await recipeFixture()
    testLabels = await labelFixture()
    testDatasets = (await datasetFixture()).imageDatasets
    testAssets = (await assetFixture()).images
    testTextAssets = (await assetFixture()).text
  })
  afterAll(async () => {
    await teardown()
  })
  test('Create an annotation', async () => {
    const testAsset = await assetRepo.getAssetById(testAssets[0][0]._id)
    targetedResources.populatedAsset = testAsset
    const testLabel = await Label.findOne({
      recipe: testAsset.dataset.recipe,
      tool: 'boundingBox'
    })
    if (!testLabel) {
      throw new Error('Test aborted - matching label not found.')
    }
    targetedResources.boundingBoxLabel = testLabel
    const createAnnotation = await annotationRepo.createAnnotation(testAsset, {
      data: {
        center: [0.5, 0.5],
        dimensions: [0.2, 0.6],
        rotation: 20,
      },
      label: testLabel._id,
    }) as HydratedDocument<IBoundingBox>
    expect(createAnnotation.label.toString()).toEqual(testLabel._id.toString())
    expect(createAnnotation._id).toBeTruthy()
    expect(createAnnotation.asset.toString()).toEqual(testAsset._id.toString())
    expect(createAnnotation.data.center).toEqual([0.5, 0.5])
    expect(createAnnotation.data.dimensions).toEqual([0.2, 0.6])
    expect(createAnnotation.data.rotation).toEqual(20)
    annotationId = createAnnotation._id
  })
  test('Cannot create an annotation in a misc dataset.', async () => {
    const testAsset = await assetRepo.getAssetById(testTextAssets[0][0]._id)
    const testLabel = await Label.findOne({
      recipe: testAsset.dataset.recipe,
      tool: 'boundingBox'
    })
    if (!testLabel) {
      throw new Error('Test aborted - matching label not found.')
    }
    const createAnnotation = annotationRepo.createAnnotation(testAsset, {
      data: {
        center: [0.5, 0.5],
        dimensions: [0.2, 0.6],
        rotation: 20,
      },
      label: testLabel._id,
    })
    await expect(createAnnotation).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })
  test('Invalid annotations (such as a label bound to the line tool, but the user supplies bounding box data)', async () => {
    const testAsset = await assetRepo.getAssetById(testAssets[0][0]._id)
    const testLabel = await Label.findOne({
      recipe: testAsset.dataset.recipe,
      tool: 'line'
    })
    if (!testLabel) {
      throw new Error('Test aborted - matching label not found.')
    }
    const createFail = annotationRepo.createAnnotation(testAsset, {
      data: {
        center: [0.5, 0.3],
        dimensions: [0.2, 0.6],
        rotation: 20,
      },
      label: testLabel._id,
    })
    await expect(createFail).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })
  test('An asset cannot use other recipe\'s labels other than ones in the recipe that is bound to the dataset.', async () => {
    const testAsset = await assetRepo.getAssetById(testAssets[0][0]._id)
    const testLabel = await Label.findOne({
      recipe: {
        $ne: testAsset.dataset.recipe
      },
      tool: 'boundingBox'
    })
    if (!testLabel) {
      throw new Error('Test aborted - matching label not found.')
    }
    const createFail = annotationRepo.createAnnotation(testAsset, {
      data: {
        center: [0.5, 0.3],
        dimensions: [0.2, 0.6],
        rotation: 20,
      },
      label: testLabel._id,
    })
    await expect(createFail).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })
  test('Get annotation by ID', async () => {
    const fetchedAnnotation = await annotationRepo.getAnnotationById(annotationId)
    const data = fetchedAnnotation.data as IBoundingBoxData
    expect(data.center).toEqual([0.5, 0.5])
    expect(data.dimensions).toEqual([0.2, 0.6])
    expect(data.rotation).toEqual(20)
    expect(fetchedAnnotation.frame).toEqual(undefined)
    expect(fetchedAnnotation._id).toBeTruthy()
    expect(fetchedAnnotation.asset._id.toString()).toEqual(targetedResources.populatedAsset._id.toString())
  })
  test('Edit annotation', async () => {
    const fetchedAnnotation = await annotationRepo.getAnnotationById(annotationId)
    const lineLabel = await Label.findOne({
      recipe: targetedResources.populatedAsset.dataset.recipe,
      tool: 'line'
    })
    if (!lineLabel) {
      throw new Error('Test aborted - matching label not found.')
    }
    targetedResources.lineLabel = lineLabel
    await annotationRepo.depopulateAndEditAnnotation(fetchedAnnotation, {
      data: {
        points: [[0.5, 0.6], [0.7, 0.8]]
      },
      label: lineLabel._id,
    })
    const refetchedAnnotation = await annotationRepo.getAnnotationById(annotationId)
    const refetchedAnnotationData = refetchedAnnotation.data as ILineData
    expect(refetchedAnnotationData.points).toEqual([[0.5, 0.6], [0.7, 0.8]])
    expect(refetchedAnnotation.frame).toEqual(undefined)
    expect(refetchedAnnotation.label._id.toString()).toEqual(lineLabel._id.toString())
  })
  test('Tool mismatch when editing annotation - should reject', async () => {
    const fetchedAnnotation = await annotationRepo.getAnnotationById(annotationId)
    const ellipseLabel = await Label.findOne({
      recipe: targetedResources.populatedAsset.dataset.recipe,
      tool: 'ellipse'
    })
    if (!ellipseLabel) {
      throw new Error('Test aborted - matching label not found.')
    }
    targetedResources.ellipseLabel = ellipseLabel
    const attempt = annotationRepo.depopulateAndEditAnnotation(fetchedAnnotation, {
      data: {
        points: [[0.5, 0.6], [0.7, 0.8]]
      },
      label: ellipseLabel._id,
    })
    await expect(attempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })
  test('Labels from recipe other than the recipe bound to the dataset - must also reject', async () => {
    const fetchedAnnotation = await annotationRepo.getAnnotationById(annotationId)
    const otherLabel = await Label.findOne({
      recipe: {
        $ne: targetedResources.populatedAsset.dataset.recipe
      },
      tool: 'line'
    })
    if (!otherLabel) {
      throw new Error('Test aborted - matching label not found.')
    }
    targetedResources.ellipseLabel = otherLabel
    const attempt = annotationRepo.depopulateAndEditAnnotation(fetchedAnnotation, {
      data: {
        points: [[0.5, 0.6], [0.7, 0.8]]
      },
      label: otherLabel._id,
    })
    await expect(attempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })
  test('Verify ownership of annotation.', async () => {
    const fetchedAnnotation = await annotationRepo.getAnnotationById(annotationId)
    const invalidUser = await User.findOne({
      _id: {
        $ne: testUsers[0]._id
      }
    })
    if (!invalidUser) {
      throw new Error('Test aborted - required user not found.')
    }
    await expect(async () => annotationRepo.verifyAnnotationOwner(fetchedAnnotation, testUsers[0])).resolves
    await expect(async () => annotationRepo.verifyAnnotationOwner(fetchedAnnotation, invalidUser)).rejects.toBeInstanceOf(UserMismatchError)
  })
  test('Delete annotation', async () => {
    const fetchedAnnotation = await annotationRepo.getAnnotationById(annotationId)
    await annotationRepo.deleteAnnotation(fetchedAnnotation)
    const attempt = annotationRepo.getAnnotationById(annotationId)
    await expect(attempt).rejects.toBeInstanceOf(NotFoundError)
  })
  test('Create multiple annotations', async () => {
    for (let assetCollection of testAssets) {
      for (let asset of assetCollection) {
        const testAsset = await assetRepo.getAssetById(asset._id)
        for (let i = 0; i < 4; i++) {
          const annotationType = lodash.sample(ANNOTATION_TOOL_ENUM._def.values)!
          const label = await Label.findOne({
            recipe: testAsset.dataset.recipe,
            tool: annotationType,
          })
          if (!label) {
            throw new Error('Label missing - abort test.')
          }
          const generated = generateAnnotationData(annotationType)
          await annotationRepo.createAnnotation(testAsset, {
            label: label._id,
            data: generated as any,
          })
        }
      }
    }
  })
  test('Aggregate count of annotated assets', async () => {
    const aggregatedCount = await assetRepo.aggregateAssetCountsByDatasets(testDatasets)
    for (let item of aggregatedCount) {
      expect(item.dataset).toBeInstanceOf(ObjectId)
      expect(item.byAnnotationStatus.annotated).toBeGreaterThanOrEqual(0)
      expect(item.byAnnotationStatus.unannotated).toBeGreaterThanOrEqual(0)
    }
  })
  test('Aggregate annotation count by datasets', async () => {
    const aggregatedCount = await annotationRepo.aggregateAnnotationCountsByDatasets(testDatasets)
    for (let item of aggregatedCount) {
      expect(item.total).toBeGreaterThanOrEqual(0)
      expect(item.dataset).toBeInstanceOf(ObjectId)
    }
  })
  test('Delete annotations by asset', async () => {
    const annotationSnapshot1 = await Annotation.find({
      asset: testAssets[0][0]._id,
    })
    const annotationSnapshot1_asset2 = await Annotation.find({
      asset: testAssets[0][1]._id,
    })
    const testAsset = await assetRepo.getAssetById(testAssets[0][0]._id)
    await annotationRepo.deleteAnnotationsByAsset(testAsset)
    const annotationSnapshot2 = await Annotation.find({
      asset: testAssets[0][0]._id,
    })
    const annotationSnapshot2_asset2 = await Annotation.find({
      asset: testAssets[0][1]._id,
    })
    expect(annotationSnapshot1.length).toBeGreaterThan(0)
    expect(annotationSnapshot2.length).toEqual(0)
    expect(annotationSnapshot1_asset2.length).toBeGreaterThan(0)
    expect(annotationSnapshot2_asset2.length).toEqual(annotationSnapshot1_asset2.length)
  })
  test('Asset deletion also triggers annotation deletion', async () => {
    const annotationSnapshot1 = await Annotation.find({
      asset: testAssets[0][2]._id,
    })
    const annotationSnapshot1_asset2 = await Annotation.find({
      asset: testAssets[0][3]._id,
    })
    const testAsset = await assetRepo.getAssetById(testAssets[0][2]._id)
    await assetRepo.deleteAsset(testAsset)
    const annotationSnapshot2 = await Annotation.find({
      asset: testAssets[0][2]._id,
    })
    const annotationSnapshot2_asset2 = await Annotation.find({
      asset: testAssets[0][3]._id,
    })
    expect(annotationSnapshot1.length).toBeGreaterThan(0)
    expect(annotationSnapshot2.length).toEqual(0)
    expect(annotationSnapshot1_asset2.length).toBeGreaterThan(0)
    expect(annotationSnapshot2_asset2.length).toEqual(annotationSnapshot1_asset2.length)
  })
  test('Emptying the dataset causes all annotation entities in that dataset to disappear.', async () => {
    const dataset = await datasetRepo.getDatasetById(testAssets[0][0].dataset._id)
    await datasetRepo.removeDataset(dataset)
    const result = await Annotation.aggregate([
      {
        $lookup: {
          from: Asset.collection.collectionName,
          localField: 'asset',
          foreignField: '_id',
          as: 'asset',
        },
      },
      {
        $match: {
          'asset.dataset': dataset._id,
        }
      },
    ])
    expect(result.length).toEqual(0)
    const dataset2 = await datasetRepo.getDatasetById(testAssets[1][0].dataset._id)
    const result2 = await Annotation.aggregate([
      {
        $lookup: {
          from: Asset.collection.collectionName,
          localField: 'asset',
          foreignField: '_id',
          as: 'asset',
        },
      },
      {
        $match: {
          'asset.dataset': dataset2._id,
        }
      },
    ])
    expect(result2.length).toBeGreaterThan(0)
  })

})