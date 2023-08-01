import express from 'express'
import PullRequestMessageService from '@/domains/pullRequests/messages/service'
import { ObjectId } from '@/utils/abbreviations'
import z from 'zod'

export async function createPullRequestMessage (req: express.Request, res: express.Response) {
  const pullRequestId = new ObjectId(z.string().nonempty().parse(req.params.pullRequestId))
  const result = await new PullRequestMessageService(req.user!).createPullRequestMessage(pullRequestId, {
    message: z.string().nonempty().parse(req.body.message)
  })
  res.json({
    success: true,
    data: result,
  })
}

export async function getPullRequestMessages (req: express.Request, res: express.Response) {
  const pullRequestId = new ObjectId(z.string().nonempty().parse(req.params.pullRequestId))
  const result = await new PullRequestMessageService(req.user!).getPullRequestMessages(pullRequestId, {
    expand: req.expand,
    sort: req.sort,
    pagination: req.pagination,
  })
  res.json({
    success: true,
    ...result,
  })
}

export async function editPullRequestMessage (req: express.Request, res: express.Response) {
  const messageId = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PullRequestMessageService(req.user!).editPullRequestMessage(messageId, {
    message: z.string().nonempty().parse(req.body.message)
  })
  res.json({
    success: true,
  })
}

export async function deletePullRequestMessage (req: express.Request, res: express.Response) {
  const messageId = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PullRequestMessageService(req.user!).deletePullRequestMessage(messageId)
  res.json({
    success: true,
  })
}
