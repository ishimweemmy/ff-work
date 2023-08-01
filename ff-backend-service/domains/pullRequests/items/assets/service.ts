import AbstractService from '@/utils/artifacts/AbstractService'
import PullRequestAssetRepository from '@/domains/pullRequests/items/assets/repository'
import { ObjectId } from '@/utils/abbreviations'
import PullRequestRepository from '@/domains/pullRequests/repository'
import AssetRepository from '@/domains/assets/repository'
import { InvalidArgumentsError, NotFoundError } from '@/utils/errors'
import DatasetRepository from '@/domains/datasets/repository'

export default class PullRequestAssetService extends AbstractService {
  repo = new PullRequestAssetRepository()
  pullRequestRepo = new PullRequestRepository()
  datasetRepo = new DatasetRepository()
  assetRepo = new AssetRepository()

  async createPullRequestImage (pullRequestId: ObjectId, file: Express.Multer.File) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'write')
    await this.repo.addImageToPullRequest(pr, file)
  }

  async createPullRequestTextAsset (pullRequestId: ObjectId, file: Express.Multer.File) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'write')
    await this.repo.addTextAssetToPullRequest(pr, file)
  }

  async createPullRequestMiscAsset (pullRequestId: ObjectId, file: Express.Multer.File) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'write')
    await this.repo.addMiscAssetToPullRequest(pr, file)
  }

  async deletePullRequestAsset (assetId: ObjectId) {
    try {
      const prAsset = await this.repo.getNewAssetInPullRequestById(assetId)
      await this.pullRequestRepo.requestPullRequestPermission(prAsset.pullRequest, this.user, 'write')
      await this.repo.deleteNewAssetFromPullRequest(prAsset)
    } catch (e) {
      if (!(e instanceof NotFoundError)) {
        throw e
      }
    }
  }

  async deleteExistingAsset (pullRequestId: ObjectId, assetId: ObjectId) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'write')
    const existingAsset = await this.assetRepo.getAssetById(assetId)
    if (!existingAsset.dataset._id.equals(pr.dataset)) {
      throw new InvalidArgumentsError('Targeted asset must belong to the same PR as pull request.')
    }
    await this.repo.queueDeletionOfExistingAsset(pr, existingAsset)
  }

  async revertDeletedExistingAsset (pullRequestId: ObjectId, assetId: ObjectId) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'write')
    const existingAsset = await this.assetRepo.getAssetById(assetId)
    if (!existingAsset.dataset._id.equals(pr.dataset)) {
      throw new InvalidArgumentsError('Targeted asset must belong to the same PR as pull request.')
    }
    await this.repo.unQueueDeletionOfExistingAsset(pr, existingAsset)
  }

  async getPullRequestAsset (assetId: ObjectId, query: {
    expand: string[]
  }) {
    const pullRequestAsset = await this.repo.getNewAssetInPullRequestById(assetId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequestAsset.pullRequest, this.user, 'read')
    const populatedItems = await this.repo.expandPullRequestAssets([pullRequestAsset.toObject()], query.expand)
    return populatedItems[0]
  }

  async getExistingAssetInPullRequest (pullRequestId: ObjectId, assetId: ObjectId, query: {
    expand: string[]
  }) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'read')
    const existingAsset = await this.assetRepo.getAssetById(assetId)
    if (!existingAsset.dataset._id.equals(pullRequest.dataset)) {
      throw new NotFoundError('The asset is not in the same dataset as the PR.')
    }
    const populatedItems = await this.repo.expandExistingAssetsInPullRequest(pullRequest, [existingAsset.toObject()], query.expand)
    return populatedItems[0]
  }

  async searchPullRequestAssets (pullRequestId: ObjectId, query: {
    displayName?: string,
    pagination?: Express.RequestPagination,
    expand: string[]
  }) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'read')

    const page = await this.repo.searchPullRequestAssetsByPullRequest(pr, {
      displayName: query.displayName,
      pagination: query.pagination,
    })
    const populatedItems = await this.repo.expandPullRequestAssets(page.data, query.expand)
    return {
      data: populatedItems,
      meta: page.meta
    }
  }

  async searchExistingAssetsAlteredByPullRequest (pullRequestId: ObjectId, query: {
    displayName?: string,
    pagination?: Express.RequestPagination,
    expand: string[]
  }) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'write')

    const page = await this.repo.searchExistingAssetsAlteredByPullRequest(pr, {
      displayName: query.displayName,
      pagination: query.pagination,
    })
    const populatedItems = await this.repo.expandExistingAssetsInPullRequest(pr, page.data, query.expand)
    return {
      data: populatedItems,
      meta: page.meta
    }
  }

  async searchExistingAssetsDeletedByPullRequest (pullRequestId: ObjectId, query: {
    displayName?: string,
    pagination?: Express.RequestPagination,
    expand: string[]
  }) {
    const pr = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pr, this.user, 'write')

    const page = await this.repo.searchExistingAssetsDeletedByPullRequest(pr, {
      displayName: query.displayName,
      pagination: query.pagination,
    })
    const populatedItems = await this.repo.expandExistingAssetsInPullRequest(pr, page.data, query.expand)
    return {
      data: populatedItems,
      meta: page.meta
    }
  }
}