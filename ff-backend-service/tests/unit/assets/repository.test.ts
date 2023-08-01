import { setup, teardown } from '@/tests/unit/base'
import labelFixture from '@/tests/unit/labels/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import userFixture from '@/tests/unit/users/fixture'
import User, { IUser } from '@/domains/users/models/UserModel'
import mongoose, { HydratedDocument } from 'mongoose'
import { IRecipe } from '@/domains/recipes/model'
import { ILabel } from '@/domains/labels/model'
import { IDataset } from '@/domains/datasets/model'
import datasetFixture from '@/tests/unit/datasets/fixture'
import AssetRepository from '@/domains/assets/repository'
import fs from 'fs'
import Asset, { IAsset } from '@/domains/assets/model'
import path from 'path'
import axios from 'axios'
import { transformImage } from '@/domains/assets/utils'
import mime from 'mime-types'
import { NotFoundError, UserMismatchError } from '@/utils/errors'
import * as config from '@/utils/config'
import { GetObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3'
import * as process from 'process'
import { ObjectId } from '@/utils/abbreviations'
import DatasetRepository from '@/domains/datasets/repository'
import * as console from 'console'

const assetRepo = new AssetRepository()
const datasetRepo = new DatasetRepository()
const s3 = new S3Client(config.S3_CONFIG)

describe('datasetRepository', () => {
  let testUsers: IUser[]
  let testRecipes: HydratedDocument<IRecipe>[]
  let testLabels: HydratedDocument<ILabel>[]
  let testDatasets: HydratedDocument<IDataset>[]
  let testMiscDatasets: HydratedDocument<IDataset>[]
  let targetedAssets: {
    image: HydratedDocument<IAsset>,
    images: HydratedDocument<IAsset>[],
  } = {
    images: [],
  } as any

  let assetUrl: string
  let imageFiles: Express.Multer.File[] = []
  let textFiles: Express.Multer.File[] = []
  beforeAll(async () => {
    await setup()
    testUsers = await userFixture()
    testRecipes = await recipeFixture()
    testLabels = await labelFixture()
    testDatasets = (await datasetFixture()).imageDatasets
    testMiscDatasets = (await datasetFixture()).miscDatasets

    const IMAGE_ASSET_DIR = './tests/assets/images'
    for (let file of await fs.promises.readdir(IMAGE_ASSET_DIR)) {
      const fp = path.join(IMAGE_ASSET_DIR, file)
      const fstat = await fs.promises.stat(fp)
      imageFiles.push({
        size: fstat.size,
        buffer: await fs.promises.readFile(fp),
        path: fp,
        originalname: file,
        filename: file,
        mimetype: mime.lookup(file) || '',
        fieldname: 'image',
      } as Express.Multer.File)
    }

    const TEXT_ASSET_DIR = './tests/assets/text'
    for (let file of await fs.promises.readdir(TEXT_ASSET_DIR)) {
      const fp = path.join(TEXT_ASSET_DIR, file)
      const fstat = await fs.promises.stat(fp)
      textFiles.push({
        size: fstat.size,
        buffer: await fs.promises.readFile(fp),
        path: fp,
        originalname: file,
        filename: file,
        mimetype: mime.lookup(file) || 'application/octet-stream',
        fieldname: 'image',
      } as Express.Multer.File)
    }
  })
  afterAll(async () => {
    await teardown()
  })

  test('Create image asset', async () => {
    const image = await assetRepo.addImageToDataset(testDatasets[0], imageFiles[0])
    targetedAssets.image = image
    expect(image.dataset.toString()).toEqual(testDatasets[0]._id.toString())
    expect(image.displayName).toEqual(imageFiles[0].originalname)
    expect(image.size).toEqual(imageFiles[0].size)
    expect(image.apiIdentifier).toEqual(undefined)
    expect(image.stage).toEqual('uploaded')
    expect(image.type).toEqual('image')
    expect(image.mimetype).toBeTruthy()
    expect(image._id).toBeTruthy()
  })
  test('Trying to add text asset to an image dataset - will crash.', async () => {
    await expect(assetRepo.addMiscellaneousAssetToDataset(testDatasets[0], textFiles[0])).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
  })
  test('Miscellaneous datasets can have any kind of assets attached.', async () => {
    const miscAsset = await assetRepo.addMiscellaneousAssetToDataset(testMiscDatasets[0], textFiles[0])
    expect(miscAsset.dataset.toString()).toEqual(testMiscDatasets[0]._id.toString())
    expect(miscAsset.displayName).toEqual(textFiles[0].originalname)
    expect(miscAsset.size).toEqual(textFiles[0].size)
    expect(miscAsset.apiIdentifier).toEqual(undefined)
    expect(miscAsset.stage).toEqual('uploaded')
    expect(miscAsset.type).toEqual('other')
    expect(miscAsset.mimetype).toBeTruthy()
    expect(miscAsset._id).toBeTruthy()
  })
  test('Get image by ID', async () => {
    const fetchedImage = await assetRepo.getAssetById(targetedAssets.image._id)
    expect(fetchedImage.dataset._id.toString()).toEqual(testDatasets[0]._id.toString())
    expect(fetchedImage.displayName).toEqual(imageFiles[0].originalname)
    expect(fetchedImage.size).toEqual(imageFiles[0].size)
    expect(fetchedImage.apiIdentifier).toEqual(undefined)
    expect(fetchedImage.stage).toEqual('uploaded')
    expect(fetchedImage.type).toEqual('image')
    expect(fetchedImage._id).toBeTruthy()
  })
  test('Get live URL of asset', async () => {
    const fetchedImage = await assetRepo.getAssetById(targetedAssets.image._id)
    const url = await assetRepo.getS3UrlOfAsset(fetchedImage)
    expect(url).toBeTruthy()
    const buf = (await axios.get<string>(url, {
      responseType: 'text',
    })).data
    assetUrl = url
    const originalBuf = (await transformImage(imageFiles[0].buffer)).toString()
    await expect(buf).toEqual(originalBuf)
  })
  test('Verify owner of asset', async () => {
    const fetchedImage = await assetRepo.getAssetById(targetedAssets.image._id)
    assetRepo.verifyAssetOwner(fetchedImage, testUsers[0])
  })
  test('Reject non-owners from owner permissions', async () => {
    const fetchedImage = await assetRepo.getAssetById(targetedAssets.image._id)
    const invalidUser = await User.findOne({
      _id: {
        $ne: testUsers[0]._id,
      }
    })
    if (!invalidUser) {
      throw new Error('Non-owning user not found - exiting.')
    }
    await expect(async () => assetRepo.verifyAssetOwner(fetchedImage, invalidUser)).rejects.toBeInstanceOf(UserMismatchError)
  })
  test('Delete asset. The get command has to throw 404.', async () => {
    const fetchedImage = await assetRepo.getAssetById(targetedAssets.image._id)
    await assetRepo.deleteAsset(fetchedImage)

    const attempt = assetRepo.getAssetById(targetedAssets.image.id)
    await expect(attempt).rejects.toBeInstanceOf(NotFoundError)
    const failedFetch = s3.send(new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fetchedImage._id.toString(),
    }))
    await expect(failedFetch).rejects.toBeInstanceOf(NoSuchKey)
  })
  test('Create multiple assets.', async () => {
    const promises: Promise<HydratedDocument<IAsset>>[] = []
    for (let i = 0; i < 2; i++) {
      for (let rawFile of imageFiles) {
        promises.push(assetRepo.addImageToDataset(testDatasets[i], rawFile))
      }
    }
    targetedAssets.images = await Promise.all(promises)
  })
  test('Making the dataset public causes the dataset to automatically have a thumbnail if there is any asset existing.', async () => {
    await datasetRepo.changeDatasetPublicVisibility(testDatasets[0], true)
    const fetched = await datasetRepo.getDatasetById(testDatasets[0]._id)
    expect(fetched.thumbnail?.assetKey).toBeInstanceOf(ObjectId)
    const url = fetched.thumbnail?.url
    expect(url).toBeTruthy()
    expect((await axios.get(url!, {
      responseType: 'arraybuffer'
    })).data).toBeTruthy()
  })
  test('Count assets in dataset', async () => {
    expect(await assetRepo.countAssetsByDataset(testDatasets[0], 'all')).toEqual(imageFiles.length)
    expect(await assetRepo.countAssetsByDataset(testDatasets[0], 'uploaded')).toEqual(imageFiles.length)
    expect(await assetRepo.countAssetsByDataset(testDatasets[0], 'feedback')).toEqual(0)
    expect(await assetRepo.countAssetsByDataset(testDatasets[0], 'completed')).toEqual(0)
  })
  test('Count assets with aggregate', async () => {
    const result = await assetRepo.aggregateAssetCountsByDataset(testDatasets[0])
    expect(result.byStage.uploaded).toBeGreaterThan(0)
    expect(result.byStage.feedback).toEqual(0)
    expect(result.byStage.completed).toEqual(0)
  })
  test('Count assets with custom aggregate', async () => {
    const result = await assetRepo.aggregateAssetCountsByDatasets(testDatasets)
    for (let item of result) {
      expect(item.dataset).toBeInstanceOf(ObjectId)
      expect(typeof item.byStage.completed).toEqual('number')
      expect(typeof item.byStage.uploaded).toEqual('number')
      expect(typeof item.byStage.feedback).toEqual('number')
      expect(typeof item.total).toEqual('number')
      expect(item.byStage.completed).toBeGreaterThanOrEqual(0)
      expect(item.byStage.uploaded).toBeGreaterThanOrEqual(0)
      expect(item.byStage.feedback).toBeGreaterThanOrEqual(0)
      expect(item.total).toBeGreaterThanOrEqual(0)
    }
  })
  test('Sum asset sizes with custom aggregate', async () => {
    const result = await assetRepo.aggregateTotalSizesByDatasets(testDatasets)
    for (let item of result) {
      expect(item.dataset).toBeInstanceOf(ObjectId)
      expect(typeof item.byStage.completed).toEqual('number')
      expect(typeof item.byStage.uploaded).toEqual('number')
      expect(typeof item.byStage.feedback).toEqual('number')
      expect(typeof item.total.total).toEqual('number')
      expect(typeof item.total.cluster).toEqual('number')
      expect(typeof item.total.cloud).toEqual('number')
      expect(item.byStage.completed).toBeGreaterThanOrEqual(0)
      expect(item.byStage.uploaded).toBeGreaterThanOrEqual(0)
      expect(item.byStage.feedback).toBeGreaterThanOrEqual(0)
      expect(item.total.total).toBeGreaterThanOrEqual(0)
      expect(item.total.cluster).toBeGreaterThanOrEqual(0)
      expect(item.total.cloud).toBeGreaterThanOrEqual(0)
    }
  })
  test('Search assets', async () => {
    const responses: any[] = [];
    let nextId: string | undefined = undefined
    do {
      const page = await assetRepo.getLeanAssetsByDataset(testDatasets[0], {
        stage: 'uploaded',
        pagination: {
          limit: 2,
          next: nextId,
        }
      })
      responses.push(...page.data)
      nextId = page.meta.next
    } while (nextId)
    expect(responses.map(leanAsset => leanAsset._id.toString())).toEqual((await Asset.find({
      stage: 'uploaded',
      dataset: testDatasets[0]._id
    }).sort({
      _id: -1,
    })).map(obj => obj._id.toString()))
  })
  test('Deleting all assets from the dataset cause affected assets to also throw 404.', async () => {
    const assets = (await assetRepo.getLeanAssetsByDataset(testDatasets[0], {
      stage: 'uploaded',
      pagination: {
        limit: Infinity,
      }
    })).data
    await assetRepo.deleteAssetsByDataset(testDatasets[0])
    for (let deletedAsset of assets) {
      const failedAttempt = assetRepo.getAssetById(deletedAsset._id)
      await expect(failedAttempt).rejects.toBeInstanceOf(NotFoundError)
      await expect(s3.send(new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: deletedAsset._id.toString()
      }))).rejects.toBeInstanceOf(NoSuchKey)
    }
  })
  test('Deleting the dataset also cause affected assets to also throw 404.', async () => {
    const assets = (await assetRepo.getLeanAssetsByDataset(testDatasets[1], {
      stage: 'uploaded',
      pagination: {
        limit: Infinity,
      }
    })).data
    await datasetRepo.removeDataset(testDatasets[1])
    for (let deletedAsset of assets) {
      const failedAttempt = assetRepo.getAssetById(deletedAsset._id)
      await expect(failedAttempt).rejects.toBeInstanceOf(NotFoundError)
      const s3 = new S3Client(config.S3_CONFIG)
      await expect(s3.send(new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: deletedAsset._id.toString()
      }))).rejects.toBeInstanceOf(NoSuchKey)
    }
  })
  test('Deleting dataset causes the thumbnail to be removed.', async () => {
    const fetched = await datasetRepo.getDatasetById(testDatasets[0]._id)
    await datasetRepo.removeDataset(fetched)
    await expect(s3.send(new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fetched.thumbnail?.assetKey.toString()
    }))).rejects.toBeInstanceOf(NoSuchKey)
  })
})