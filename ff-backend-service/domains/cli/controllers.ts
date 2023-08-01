import CLI from './service'
import express from 'express'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'
import AssetService from '@/domains/assets/service'
import * as console from 'console'
import DatasetService from '@/domains/datasets/service'

export async function getDatasetAsset (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new AssetService(request.user!).getAssetById(id)
  response.send({
    success: true,
    data: result,
  })
}

export async function getDatasetAssets (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new CLI(request.user!).getDatasetAssets(id, {
    stage: z.string().optional().parse(request.query.stage),
    displayName: z.string().optional().parse(request.query.displayName),
    pagination: request.pagination
  })
  response.send({
    success: true,
    ...result,
  })
}

export async function getDatasets (request: express.Request, response: express.Response) {
  const datasets = await new CLI(request.user!).getDatasets()
  response.send({
    success: true,
    data: datasets,
  })
}

export async function getDataset (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const dataset = await new DatasetService(request.user!).getDataset(id, {
    expand: request.expand
  })
  response.send({
    success: true,
    data: dataset,
  })
}
