import express from 'express'
import PullRequestService from '@/domains/pullRequests/service'
import { ObjectId } from '@/utils/abbreviations'
import z from 'zod'
import { PULL_REQUEST_STATUS_ENUM } from '@/domains/pullRequests/model'

export async function getPullRequestById (req: express.Request, res: express.Response) {
  res.json({
    data: await new PullRequestService(req.user!).getPullRequestById(
      new ObjectId(z.string().nonempty().parse(req.params.id)), {
        expand: req.expand,
      }),
    success: true,
  })
}

export async function editPullRequest (req: express.Request, res: express.Response) {
  await new PullRequestService(req.user!).editPullRequest(
    new ObjectId(z.string().nonempty().parse(req.params.id)), {
      name: z.string().nonempty().parse(req.body.name)
    })
  res.json({
    success: true,
  })
}

export async function createPullRequest (req: express.Request, res: express.Response) {
  res.json({
    data: await new PullRequestService(req.user!).createPullRequest(
      new ObjectId(z.string().nonempty().parse(req.params.datasetId)), {
        name: z.string().nonempty().parse(req.body.name).toString(),
        description: z.string().nonempty().optional().parse(req.body.description),
      }),
    success: true,
  })
}

export async function deletePullRequest (req: express.Request, res: express.Response) {
  await new PullRequestService(req.user!).deletePullRequest(
    new ObjectId(z.string().nonempty().parse(req.params.id)))
  res.send({
    success: true,
  })
}

export async function mergePullRequest (req: express.Request, res: express.Response) {
  await new PullRequestService(req.user!).mergePullRequest(
    new ObjectId(z.string().nonempty().parse(req.params.id)))
  res.send({
    success: true,
  })
}

export async function changePullRequestStatus (req: express.Request, res: express.Response) {
  await new PullRequestService(req.user!).changePullRequestStatus(
    new ObjectId(z.string().nonempty().parse(req.params.id)),
    PULL_REQUEST_STATUS_ENUM.parse(req.body.status))
  res.send({
    success: true,
  })
}

export async function searchPullRequestsByDatasetId (req: express.Request, res: express.Response) {
  const page = await new PullRequestService(req.user!).searchPullRequestsByDatasetId(
    new ObjectId(z.string().nonempty().parse(req.params.datasetId)), {
      name: z.string().optional().parse(req.query.name),
      expand: req.expand,
      pagination: req.pagination,
    })
  res.send({
    success: true,
    ...page,
  })
}
