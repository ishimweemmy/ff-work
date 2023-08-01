import express from 'express'
import DatasetLikeService from './service'
import { ObjectId } from '@/utils/abbreviations'
import { z } from 'zod'

export async function getLikeCountOfDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetLikeService(request.user!).getCount(id)
  response.send({ success: true, data: result })
}

export async function checkIfDatasetLiked (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetLikeService(request.user!).checkIfDatasetLiked(id)
  response.send({ success: true, data: result })
}

export async function likeDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetLikeService(request.user!).likeDataset(id)
  response.send({ success: true, data: result })
}

export async function unlikeDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetLikeService(request.user!).unlikeDataset(id)
  response.send({ success: true, data: result })
}
