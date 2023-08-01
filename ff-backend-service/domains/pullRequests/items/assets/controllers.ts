import express from 'express'
import PullRequestAssetService from '@/domains/pullRequests/items/assets/service'
import { ObjectId } from '@/utils/abbreviations'
import z from 'zod'
import { FileMissingError } from '@/utils/errors'
import * as console from 'console'

export async function createNewPullRequestImage (req: express.Request, res: express.Response) {
  if (!req.file) {
    throw new FileMissingError('Necessary file is not found.')
  }
  const newAsset = await new PullRequestAssetService(req.user!).createPullRequestImage(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)), req.file)
  res.json({
    success: true,
    data: newAsset,
  })
}

export async function createNewPullRequestMiscAsset (req: express.Request, res: express.Response) {
  if (!req.file) {
    throw new FileMissingError('Necessary file is not found.')
  }
  const newAsset = await new PullRequestAssetService(req.user!).createPullRequestMiscAsset(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)), req.file)
  res.json({
    success: true,
    data: newAsset,
  })
}

export async function createNewPullRequestTextAsset (req: express.Request, res: express.Response) {
  if (!req.file) {
    throw new FileMissingError('Necessary file is not found.')
  }
  const newAsset = await new PullRequestAssetService(req.user!).createPullRequestTextAsset(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)), req.file)
  res.json({
    success: true,
    data: newAsset,
  })
}

export async function searchPullRequestAssets (req: express.Request, res: express.Response) {
  const page = await new PullRequestAssetService(req.user!).searchPullRequestAssets(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)), {
      expand: req.expand,
      pagination: req.pagination,
      displayName: z.string().optional().parse(req.query.displayName),
    })
  res.json({
    success: true,
    ...page,
  })
}

export async function searchExistingAssetsDeletedByPullRequest (req: express.Request, res: express.Response) {
  const page = await new PullRequestAssetService(req.user!).searchExistingAssetsDeletedByPullRequest(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)), {
      expand: req.expand,
      pagination: req.pagination,
      displayName: z.string().optional().parse(req.query.displayName),
    })
  res.json({
    success: true,
    ...page,
  })
}

export async function searchExistingAssetsAlteredByPullRequest (req: express.Request, res: express.Response) {
  const page = await new PullRequestAssetService(req.user!).searchExistingAssetsAlteredByPullRequest(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)), {
      expand: req.expand,
      pagination: req.pagination,
      displayName: z.string().optional().parse(req.query.displayName),
    })
  res.json({
    success: true,
    ...page,
  })
}

export async function deletePullRequestAsset (req: express.Request, res: express.Response) {
  await new PullRequestAssetService(req.user!).deletePullRequestAsset(
    new ObjectId(z.string().nonempty().parse(req.params.id)))
  res.json({
    success: true,
  })
}

export async function getExistingAssetInPullRequest (req: express.Request, res: express.Response) {
  await new PullRequestAssetService(req.user!).getExistingAssetInPullRequest(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)),
    new ObjectId(z.string().nonempty().parse(req.params.id)), {
      expand: req.expand,
    })

  res.json({
    success: true,
  })
}

export async function getPullRequestAsset (req: express.Request, res: express.Response) {
  await new PullRequestAssetService(req.user!).getPullRequestAsset(
    new ObjectId(z.string().nonempty().parse(req.params.id)), {
      expand: req.expand,
    })
  res.json({
    success: true,
  })
}

export async function deleteExistingAsset (req: express.Request, res: express.Response) {
  await new PullRequestAssetService(req.user!).deleteExistingAsset(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)),
    new ObjectId(z.string().nonempty().parse(req.params.id)))
  res.json({
    success: true,
  })
}

export async function revertDeletedExistingAsset (req: express.Request, res: express.Response) {
  await new PullRequestAssetService(req.user!).revertDeletedExistingAsset(
    new ObjectId(z.string().nonempty().parse(req.params.pullRequestId)),
    new ObjectId(z.string().nonempty().parse(req.params.id)))

  res.json({
    success: true,
  })
}
