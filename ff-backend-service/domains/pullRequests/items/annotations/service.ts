import AbstractService from '@/utils/artifacts/AbstractService'
import PullRequestAnnotationRepository from '@/domains/pullRequests/items/annotations/repository'
import AssetRepository from '@/domains/assets/repository'
import { IPullRequestAnnotationInfo } from '@/domains/pullRequests/items/annotations/model'
import { ObjectId } from '@/utils/abbreviations'
import PullRequestRepository from '@/domains/pullRequests/repository'
import { NotFoundError } from '@/utils/errors'
import PullRequestAssetRepository from '@/domains/pullRequests/items/assets/repository'
import AnnotationRepository from '@/domains/annotations/repository'

export default class PullRequestAnnotationService extends AbstractService {
  repo = new PullRequestAnnotationRepository()
  assetRepo = new AssetRepository()
  annotationRepo = new AnnotationRepository()
  pullRequestRepo = new PullRequestRepository()
  pullRequestAssetRepo = new PullRequestAssetRepository()

  async addAnnotationToExistingAsset (pullRequestId: ObjectId,
    assetId: ObjectId, data: IPullRequestAnnotationInfo) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'write')
    const asset = await this.assetRepo.getAssetById(assetId)
    if (!pullRequest.dataset.equals(asset.dataset._id)) {
      throw new NotFoundError('This asset does not belong to the same dataset as the PR.')
    }
    return await this.repo.addAnnotationToExistingAsset(pullRequest, asset, data)
  }

  async addAnnotationToPullRequestAsset (pullRequestAssetId: ObjectId, data: IPullRequestAnnotationInfo) {
    const asset = await this.pullRequestAssetRepo.getNewAssetInPullRequestById(pullRequestAssetId)
    await this.pullRequestRepo.requestPullRequestPermission(asset.pullRequest, this.user, 'write')
    return await this.repo.addAnnotationToPullRequestAsset(asset, data)
  }

  async getPullRequestAnnotationById (pullRequestAnnotationId: ObjectId) {
    const pullRequestAnnotation = await this.repo.getPullRequestAnnotationById(pullRequestAnnotationId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequestAnnotation.pullRequest, this.user, 'read')
    return pullRequestAnnotation
  }

  async getPullRequestAnnotationByExistingAnnotationId (pullRequestId: ObjectId,
    existingAnnotationId: ObjectId) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'write')
    const annotation = await this.annotationRepo.getAnnotationById(existingAnnotationId)
    if (!annotation.asset.dataset._id.equals(pullRequest.dataset)) {
      throw new NotFoundError("This annotation does not belong to the same dataset as the PR")
    }
    return await this.repo.getPullRequestAnnotationByExistingAnnotation(pullRequest, annotation)
  }

  async editPullRequestAnnotation (pullRequestAnnotationId: ObjectId, data: IPullRequestAnnotationInfo) {
    const pullRequestAnnotation = await this.repo.getPullRequestAnnotationById(pullRequestAnnotationId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequestAnnotation.pullRequest, this.user, 'write')
    await this.repo.editPullRequestAnnotation(pullRequestAnnotation, data)
  }

  async deletePullRequestAnnotation (pullRequestAnnotationId: ObjectId) {
    const pullRequestAnnotation = await this.repo.getPullRequestAnnotationById(pullRequestAnnotationId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequestAnnotation.pullRequest, this.user, 'write')
    await this.repo.deletePullRequestAnnotation(pullRequestAnnotation)
  }

  async editExistingAnnotation (pullRequestId: ObjectId, existingAnnotationId: ObjectId, data: IPullRequestAnnotationInfo) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'write')
    const annotation = await this.annotationRepo.getAnnotationById(existingAnnotationId)
    if (!annotation.asset.dataset._id.equals(pullRequest.dataset)) {
      throw new NotFoundError("This annotation does not belong to the same dataset as the PR")
    }
    await this.repo.editExistingAnnotation(pullRequest, annotation, data)
  }

  async deleteExistingAnnotation (pullRequestId: ObjectId, existingAnnotationId: ObjectId) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'write')
    const annotation = await this.annotationRepo.getAnnotationById(existingAnnotationId)
    if (!annotation.asset.dataset._id.equals(pullRequest.dataset)) {
      throw new NotFoundError("This annotation does not belong to the same dataset as the PR")
    }
    await this.repo.deleteExistingAnnotation(pullRequest, annotation)
  }

  async revertExistingAnnotation (pullRequestId: ObjectId, existingAnnotationId: ObjectId) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'write')
    const annotation = await this.annotationRepo.getAnnotationById(existingAnnotationId)
    if (!annotation.asset.dataset._id.equals(pullRequest.dataset)) {
      throw new NotFoundError("This annotation does not belong to the same dataset as the PR")
    }
    await this.repo.revertExistingAnnotation(pullRequest, annotation)
  }
}