import express from 'express'
import DatasetPermissionService from '@/domains/datasets/permissions/services'
import { stringToOptionalBoolean, toObjectId } from '@/utils/typeConversion'
import { ObjectId } from '@/utils/abbreviations'
import z from 'zod'
import { DATASET_ROLE_ENUM } from '@/domains/datasets/permissions/model'
import { InvalidArgumentsError } from '@/utils/errors'

export async function getPaginatedDatasetPermissionsByDatasetId (req: express.Request, res: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(req.params.datasetId))
  const result = await new DatasetPermissionService(req.user!).getPaginatedDatasetPermissionsByDatasetId(datasetId, {
    expand: req.expand,
    pagination: req.pagination,
  })
  res.json({
    success: true,
    ...result,
  })
}

export async function searchPaginatedDatasetPermissionsByDatasetId (req: express.Request, res: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(req.params.datasetId))
  const result = await new DatasetPermissionService(req.user!).searchPaginatedDatasetPermissionsByDatasetId(datasetId, {
    pagination: req.pagination,
    email: z.string().optional().parse(req.query.email),
    name: z.string().optional().parse(req.query.name),
  })
  res.json({
    success: true,
    data: result,
  })
}

export async function assignDatasetPermissionToUser (req: express.Request, res: express.Response) {
  const datasetId = new ObjectId(z.string().nonempty().parse(req.params.datasetId))
  const role = DATASET_ROLE_ENUM.parse(req.body.role)
  const service = await new DatasetPermissionService(req.user!)
  const email = z.string().nonempty().email().optional().parse(req.body.email)
  const username = z.string().nonempty().optional().parse(req.body.username)
  let result
  if (email) {
    result = await service.assignDatasetPermissionToUserEmail(datasetId, {
      role: role,
      email: email,
    }, {
      expand: req.expand
    })
  } else if (username) {
    result = await service.assignDatasetPermissionToUsername(datasetId, {
      role: role,
      username: username,
    }, {
      expand: req.expand
    })
  } else {
    throw new InvalidArgumentsError('Either email or username needs to be filled.')
  }
  res.json({
    success: true,
    data: result,
  })
}

export async function getDatasetPermissionById (req: express.Request, res: express.Response) {
  const permissionId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new DatasetPermissionService(req.user!).getDatasetPermissionById(permissionId)
  res.json({
    success: true,
    data: result,
  })
}

export async function editDatasetPermissionById (req: express.Request, res: express.Response) {
  const permissionId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const newRole = DATASET_ROLE_ENUM.parse(req.body.role)
  const result = await new DatasetPermissionService(req.user!).editDatasetPermissionById(permissionId, newRole)
  res.json({
    success: true,
    data: result,
  })
}

export async function revokeDatasetPermissionById (req: express.Request, res: express.Response) {
  const permissionId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new DatasetPermissionService(req.user!).revokeDatasetPermissionById(permissionId)
  res.json({
    success: true,
    data: result,
  })
}

export async function getSharedDatasets (req: express.Request, res: express.Response) {
  const result = await new DatasetPermissionService(
    req.user!
  ).searchSharedDatasets({
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
