import PullRequestAnnotationService from './service'
import { z } from 'zod'
import express from 'express'
import { ObjectId } from '@/utils/abbreviations'

export async function addAnnotationToExistingAsset (req: express.Request, res: express.Response) {
  const pullRequestId = new ObjectId(z.string().nonempty().parse(req.params.pullRequestId))
  const existingAssetId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new PullRequestAnnotationService(req.user!)
    .addAnnotationToExistingAsset(pullRequestId, existingAssetId, {
      label: new ObjectId(z.string().nonempty().parse(req.body.label)),
      data: req.body.data,
      frame: z.number().int().nonnegative().optional().parse(req.body.frame)
    })
  res.json({
    success: true,
    data: result,
  })
}

export async function addAnnotationToPullRequestAsset (req: express.Request, res: express.Response) {
  const pullRequestAssetId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new PullRequestAnnotationService(req.user!)
    .addAnnotationToPullRequestAsset(pullRequestAssetId, {
      label: new ObjectId(z.string().nonempty().parse(req.body.label)),
      data: req.body.data,
      frame: z.number().int().nonnegative().optional().parse(req.body.frame)
    })
  res.json({
    success: true,
    data: result,
  })
}

export async function getPullRequestAnnotationById (req: express.Request, res: express.Response) {
  const pullRequestAnnotationId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new PullRequestAnnotationService(req.user!)
    .getPullRequestAnnotationById(pullRequestAnnotationId)
  res.json({
    success: true,
    data: result,
  })
}

export async function editPullRequestAnnotation (req: express.Request, res: express.Response) {
  const pullRequestAnnotationId = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PullRequestAnnotationService(req.user!)
    .editPullRequestAnnotation(pullRequestAnnotationId, {
      label: new ObjectId(z.string().nonempty().parse(req.body.label)),
      data: req.body.data,
      frame: z.number().int().nonnegative().optional().parse(req.body.frame)
    })
  res.json({
    success: true,
  })
}

export async function deletePullRequestAnnotation (req: express.Request, res: express.Response) {
  const pullRequestAnnotationId = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PullRequestAnnotationService(req.user!)
    .deletePullRequestAnnotation(pullRequestAnnotationId)
  res.json({
    success: true,
  })
}

export async function getPullRequestAnnotationByExistingAnnotation (req: express.Request, res: express.Response) {
  const pullRequestId = new ObjectId(z.string().nonempty().parse(req.params.pullRequestId))
  const existingAnnotationId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new PullRequestAnnotationService(req.user!)
    .getPullRequestAnnotationByExistingAnnotationId(pullRequestId, existingAnnotationId)
  res.json({
    success: true,
    data: result,
  })
}

export async function editExistingAnnotation (req: express.Request, res: express.Response) {
  const pullRequestId = new ObjectId(z.string().nonempty().parse(req.params.pullRequestId))
  const existingAnnotationId = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PullRequestAnnotationService(req.user!)
    .editExistingAnnotation(pullRequestId, existingAnnotationId, {
      label: new ObjectId(z.string().nonempty().parse(req.body.label)),
      data: req.body.data,
      frame: z.number().int().nonnegative().optional().parse(req.body.frame)
    })
  res.json({
    success: true,
  })
}

export async function deleteExistingAnnotation (req: express.Request, res: express.Response) {
  const pullRequestId = new ObjectId(z.string().nonempty().parse(req.params.pullRequestId))
  const existingAnnotationId = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PullRequestAnnotationService(req.user!)
    .deleteExistingAnnotation(pullRequestId, existingAnnotationId)
  res.json({
    success: true,
  })
}

export async function revertExistingAnnotation (req: express.Request, res: express.Response) {
  const pullRequestId = new ObjectId(z.string().nonempty().parse(req.params.pullRequestId))
  const existingAnnotationId = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PullRequestAnnotationService(req.user!)
    .revertExistingAnnotation(pullRequestId, existingAnnotationId)
  res.json({
    success: true,
  })
}