import userFixture from '@/tests/unit/users/fixture'
import datasetFixture from '@/tests/unit/datasets/fixture'
import labelFixture from '@/tests/unit/labels/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import AssetRepository, { PopulatedAsset } from '@/domains/assets/repository'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import cachedFixture from '@/tests/unit/fixture'
import { HydratedDocument } from 'mongoose'
import { IAsset } from '@/domains/assets/model'

const assetRepo = new AssetRepository()
const IMAGE_ASSET_DIR = './tests/assets/images'
const TEXT_ASSET_DIR = './tests/assets/text'

async function _assetFixture () {
  await userFixture()
  await recipeFixture()
  await labelFixture()
  const testDatasets = await datasetFixture()

  const imageFiles: Express.Multer.File[] = []
  for (let file of await fs.promises.readdir(IMAGE_ASSET_DIR)) {
    const fp = path.join(IMAGE_ASSET_DIR, file)
    const fstat = await fs.promises.stat(fp)
    imageFiles.push({
      size: fstat.size,
      buffer: await fs.promises.readFile(fp),
      path: fp,
      originalname: file,
      filename: file,
      mimetype: mime.lookup(file) || 'application/octet-stream',
      fieldname: 'image',
    } as Express.Multer.File)
  }
  const nestedPromises: Promise<HydratedDocument<IAsset>>[][] = [[], []]
  for (let rawFile of imageFiles) {
    nestedPromises[0].push(assetRepo.addImageToDataset(testDatasets.imageDatasets[0], rawFile))
    nestedPromises[1].push(assetRepo.addImageToDataset(testDatasets.imageDatasets[1], rawFile))
  }
  const textFiles: Express.Multer.File[] = []
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
  const nestedTextPromises: Promise<HydratedDocument<IAsset>>[][] = [[], []]
  for (let rawFile of textFiles) {
    nestedTextPromises[0].push(assetRepo.addMiscellaneousAssetToDataset(testDatasets.miscDatasets[0], rawFile))
    nestedTextPromises[1].push(assetRepo.addMiscellaneousAssetToDataset(testDatasets.miscDatasets[1], rawFile))
  }
  return {
    images: await Promise.all(nestedPromises.map(promise => Promise.all(promise))),
    text: await Promise.all(nestedTextPromises.map(promise => Promise.all(promise))),
  }
}

const assetFixture = cachedFixture(_assetFixture)
export default assetFixture