import express from 'express'
import { stringToOptionalBoolean } from '@/utils/typeConversion'
import { ObjectId } from '@/utils/abbreviations'
import z from 'zod'
import CollectionItemService from '@/domains/collections/items/services'

export async function searchDatasets (
  request: express.Request,
  response: express.Response
) {
  const collectionId = new ObjectId(z.string().nonempty().parse(request.params.id));
  const result = await new CollectionItemService(
    request.user!
  ).searchDatasets(collectionId, {
    paid: stringToOptionalBoolean(request.query.paid),
    public: stringToOptionalBoolean(request.query.public),
    user: request.query.user ? new ObjectId(z.string().optional().parse(request.query.user)) : undefined,
    recipe: request.query.recipe ? new ObjectId(z.string().optional().parse(request.query.recipe)) : undefined,
    name: z.string().optional().parse(request.query.name),
    sort: request.sort,
    expand: request.expand,
    pagination: request.pagination,
  })
  response.json({
    success: true,
    ...result,
  })
}

export async function addDataset (
  request: express.Request,
  response: express.Response
) {
  const collectionId = new ObjectId(z.string().nonempty().parse(request.params.id));
  const datasetId = new ObjectId(z.string().nonempty().parse(request.body.dataset));
  const result = await new CollectionItemService(
    request.user!
  ).addDataset(collectionId, datasetId);
  response.json({
    success: true,
    data: result,
  })
}

export async function deleteDataset (
  request: express.Request,
  response: express.Response
) {
  const collectionId = new ObjectId(z.string().nonempty().parse(request.params.collectionId));
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.id));
  const result = await new CollectionItemService(
    request.user!
  ).deleteDataset(collectionId, datasetId);
  response.json({
    success: true,
    data: result,
  })
}
