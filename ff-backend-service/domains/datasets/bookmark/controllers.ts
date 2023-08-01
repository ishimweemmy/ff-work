import express from 'express'
import DatasetBookmarkService from './service'
import { ObjectId } from '@/utils/abbreviations'
import { stringToOptionalBoolean } from '@/utils/typeConversion'
import { z } from 'zod'

export async function getBookmarkCountOfDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetBookmarkService(request.user!).getCount(id)
  response.send({ success: true, data: result })
}

export async function checkIfDatasetBookmarked (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetBookmarkService(request.user!).checkIfDatasetBookmarked(id)
  response.send({ success: true, data: result })
}

export async function bookmarkDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetBookmarkService(request.user!).bookmarkDataset(id)
  response.send({ success: true, data: result })
}

export async function unbookmarkDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.datasetId))
  const result = await new DatasetBookmarkService(request.user!).unbookmarkDataset(id)
  response.send({ success: true, data: result })
}


export async function getBookmarkedDatasets (req: express.Request, res: express.Response) {
  const result = await new DatasetBookmarkService(
    req.user!
  ).searchBookmarkedDatasets({
    paid: stringToOptionalBoolean(req.query.paid),
    public: stringToOptionalBoolean(req.query.public),
    recipe: req.query.recipe ? new ObjectId(z.string().optional().parse(req.query.recipe)) : undefined,
    name: z.string().optional().parse(req.query.name),
    sort: req.sort,
    expand: req.expand,
    pagination: req.pagination,
  });
  res.send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}

