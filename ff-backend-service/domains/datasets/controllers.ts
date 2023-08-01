import Dataset from './model'
import { FileMissingError, NotFoundError } from '@/utils/errors'
import DatasetService from './service'
import User from '../users/models/UserModel'
import path from 'path'
import { createNotification } from '../notifications/push/createNotifications'
import { SESEmailService } from '../emails/EmailService'
import express from 'express'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'
import { SUPPORTED_ASSET_TYPE_ENUM } from '@/domains/assets/enums'
import { stringToOptionalBoolean } from '@/utils/typeConversion'
import RecipeService from '../recipes/service'
import AbstractPublicService from '@/utils/artifacts/AbstractPublicService'
import DatasetPublicService from '@/domains/datasets/publicService'
import { DATASET_LICENSE_ENUM } from '@/domains/datasets/enums'

export async function getDatasets (
  request: express.Request,
  response: express.Response
) {
  const results = await new DatasetService(request.user!).getDatasets({
    expand: request.expand,
    pagination: request.pagination,
  })
  response.json({
    success: true,
    ...results,
  })
}

export async function searchDatasets (
  request: express.Request,
  response: express.Response
) {
  let result
  const query = {
    paid: stringToOptionalBoolean(request.query.paid),
    public: stringToOptionalBoolean(request.query.public),
    user: request.query.user ? new ObjectId(z.string().optional().parse(request.query.user)) : undefined,
    recipe: request.query.recipe ? new ObjectId(z.string().optional().parse(request.query.recipe)) : undefined,
    name: z.string().optional().parse(request.query.name),
    sort: request.sort,
    expand: request.expand,
    pagination: request.pagination,
  }
  if (request.user) {
    result = await new DatasetService(
      request.user
    ).searchDatasets(query)
  } else {
    result = await new DatasetPublicService().searchPublicDatasets(query)
  }
  response.json({
    success: true,
    ...result,
  })
}

export async function changeDatasetLicense(
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  await new DatasetService(request.user!).changeDatasetLicense(
    id,
    DATASET_LICENSE_ENUM.parse(request.body.license),
  )
  response.json({
    success: true,
  })
}

export async function createDataset (
  request: express.Request,
  response: express.Response
) {
  let recipeId: ObjectId | string
  if (!request.body.recipe) {
    const recipe = await new RecipeService(request.user!).createRecipe({
      immutable: false,
      name: `${request.body.name} recipe`
    })
    recipeId = recipe._id
  } else recipeId = request.body.recipe
  const createParams = {
    type: SUPPORTED_ASSET_TYPE_ENUM.parse(request.body.type),
    recipe: new ObjectId(z.string().nonempty().parse(recipeId)),
    license: DATASET_LICENSE_ENUM.optional().parse(request.body.license),
    name: z.string().nonempty().parse(request.body.name),
    description: z.string().nonempty().parse(request.body.description),
    tags: z.array(z.string()).optional().parse(request.body.tags),
    subTags: z.array(z.string()).optional().parse(request.body.subTags),
    public: z.boolean().optional().parse(request.body.public),
    price: z.number().nonnegative().optional().parse(request.body.price),
  }
  const result = await new DatasetService(request.user!).createDataset(
    createParams
  )
  response.json({
    success: true,
    data: result.toJSON(),
  })
}

export async function getDatasetDetails (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const datasetClient = await new DatasetService(request.user!)
  const result = await datasetClient.getDataset(id, {
    expand: request.expand,
  })
  response.json({
    success: true,
    data: result,
  })
}

export async function getDatasetStage (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const dataset = await new DatasetService(request.user!).getDataset(id, {
    expand: request.expand,
  })
  response.json({
    success: true,
    data: dataset.stage,
  })
}

export async function initiateFlockfyshTraining (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const datasetClient = new DatasetService(request.user!)
  const parameters = {
    class_search_queries: request.body.class_search_queries,
    desired_data: request.body.desired_data,
  }
  await datasetClient.initiateFlockfyshTraining(id, parameters)
  response.send({
    success: true,
  })
}

export async function continueFlockfyshTraining (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const datasetClient = new DatasetService(request.user!)
  await datasetClient.continueFlockfyshTraining(id)
  response.send({
    success: true,
  })
}

export async function deleteDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new DatasetService(request.user!).deleteDataset(id)
  response.json({
    success: true,
    data: result,
  })
}

export async function getDatasetTaskProgress (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new DatasetService(request.user!).getDatasetTaskProgress(
    id
  )
  response.json({
    success: true,
    data: result,
  })
}

export async function completeDataset (
  req: express.Request,
  res: express.Response
) {
  const dataset = await Dataset.findById(req.params.datasetId)
  if (!dataset) throw new NotFoundError('Dataset not found.')

  const user = await User.findById(dataset.user)
  const feedbackURL = path.join(
    process.env.CORS_ORIGIN,
    'dashboard',
    dataset.id,
    'feedback-assets'
  )
  const title = 'Flockfysh dataset training ready!'

  if (!user) {
    throw new NotFoundError('User not found for some reason.')
  }

  createNotification(user, {
    title: title,
    body: `Dataset ${dataset.name} is ready. Go check the annotation images!`,
    url: feedbackURL,
  })
  await new SESEmailService().sendEmail({
    recipient: user.email,
    subject: 'Dataset training complete',
    html: `<html lang="en"><head><title>${title}</title></head><body>Dataset ${dataset.name} is ready. Go check the <a href="${feedbackURL}">feedback images</a>!</body></html>`,
  })
  res.json({
    success: true,
  })
}

export async function editDataset (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const dataset = await new DatasetService(request.user!).editDataset(id, {
    name: z.string().nonempty().optional().parse(request.body.name),
    tags: z.array(z.string().nonempty()).optional().parse(request.body.tags),
    subTags: z
      .array(z.string().nonempty())
      .optional()
      .parse(request.body.subTags),
    description: z.string().nonempty().optional().parse(request.body.name),
  })
  response.json({
    success: true,
  })
}

export async function changeDatasetPublicVisibility (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  await new DatasetService(request.user!).changeDatasetPublicVisibility(
    id,
    z.boolean().parse(request.body.public)
  )
  response.json({
    success: true,
  })
}

export async function changeDatasetPrice (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  await new DatasetService(request.user!).changeDatasetPrice(
    id,
    z.number().nonnegative().parse(request.body.price)
  )
  response.json({
    success: true,
  })
}

export async function createDatasetPurchaseSession (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const sessionUrl = await new DatasetService(
    request.user!
  ).createDatasetPurchaseSession(id)
  response.json({
    success: true,
    data: sessionUrl,
  })
}

export async function getLabels (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const labels = await new DatasetService(request.user!).getLabels(id)
  response.json({
    success: true,
    data: labels,
  })
}

export async function editDatasetThumbnail (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.id))
  if (!request.file) {
    throw new FileMissingError()
  }
  await new DatasetService(request.user!).editDatasetThumbnail(datasetId, request.file)
  response.json({
    success: true,
  })
}

export async function editDatasetIcon (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.id))
  if (!request.file) {
    throw new FileMissingError()
  }
  await new DatasetService(request.user!).editDatasetIcon(datasetId, request.file)
  response.json({
    success: true,
  })
}

export async function transferDatasetOwnership (request: express.Request, response: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(request.params.id))
  const username = z.string().nonempty().parse(request.body.username)
  const retainAdmin = z.boolean().optional().parse(request.body.retainAdmin)
  await new DatasetService(request.user!).transferDatasetOwnership(datasetId, {
    username,
    retainAdmin,
  })
  response.json({
    success: true,
  })
}
