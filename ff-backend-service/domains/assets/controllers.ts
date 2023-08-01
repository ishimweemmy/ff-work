import AssetService from './service'
import express from 'express'
import { FileMissingError } from '@/utils/errors'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'

export async function deleteAsset (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const lastAsset = await new AssetService(request.user!).deleteAsset(id)
  response.json({
    success: true,
    data: lastAsset,
  })
}

export async function getAssetById (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const asset = await new AssetService(request.user!).getAssetWithUrl(id)
  response.send({
    success: true,
    data: asset
  })
}

export async function addImageToDataset (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  if (!request.file) {
    throw new FileMissingError()
  }
  const result = await new AssetService(request.user!).addImageToDataset(datasetId, request.file)
  response.json({
    success: true,
    data: result,
  })
}

export async function addMiscAssetToDataset (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  if (!request.file) {
    throw new FileMissingError()
  }
  const result = await new AssetService(request.user!).addMiscAssetToDataset(datasetId, request.file)
  response.json({
    success: true,
    data: result,
  })
}

export async function addTextAssetToDataset (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  if (!request.file) {
    throw new FileMissingError()
  }
  const result = await new AssetService(request.user!).addTextAssetToDataset(datasetId, request.file)
  response.json({
    success: true,
    data: result,
  })
}

export async function getAssetsByDatasetId (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const imageData = await new AssetService(request.user!).getAssetsByDatasetId(datasetId, {
    stage: z.string().optional().parse(request.query.stage),
    displayName: z.string().optional().parse(request.query.displayName),
    pagination: request.pagination
  })
  response.send({
    success: true,
    ...imageData,
  })
}

export async function getAssetIdsByDatasetId (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new AssetService(request.user!).getAssetIdsByDatasetId(datasetId, { stage: z.enum(['uploaded', 'feedback', 'completed']).optional().parse(request.query.stage) })
  response.json({
    success: true,
    data: result,
  })
}