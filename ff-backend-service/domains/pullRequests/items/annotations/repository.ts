import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { HydratedDocument } from 'mongoose'
import { IPullRequest } from '@/domains/pullRequests/model'
import { PopulatedAsset } from '@/domains/assets/repository'
import PullRequestAnnotation, { IPullRequestAnnotationInfo } from '@/domains/pullRequests/items/annotations/model'
import { PopulatedAnnotation } from '@/domains/annotations/repository'
import { PopulatedPullRequestAsset } from '@/domains/pullRequests/items/assets/repository'
import { ObjectId } from '@/utils/abbreviations'
import { NotFoundError } from '@/utils/errors'

export type PopulatedPullRequestAnnotationObject = Awaited<ReturnType<PullRequestAnnotationRepository['getPullRequestAnnotationById']>>

export default class PullRequestAnnotationRepository extends AbstractRepository {
  async addAnnotationToExistingAsset (pullRequest: HydratedDocument<IPullRequest>,
    asset: PopulatedAsset, data: IPullRequestAnnotationInfo) {
    return await PullRequestAnnotation.create({
      pullRequest: pullRequest._id,
      targetedAsset: asset._id,
      newAnnotation: data,
    })
  }

  async addAnnotationToPullRequestAsset (asset: PopulatedPullRequestAsset, data: IPullRequestAnnotationInfo) {
    return await PullRequestAnnotation.create({
      pullRequest: asset.pullRequest._id,
      targetedPullRequestAsset: asset._id,
      newAnnotation: data,
    })
  }

  async getPullRequestAnnotationById (id: ObjectId) {
    const annotationObject = await PullRequestAnnotation.findById(id)
      .populate<{ pullRequest: IPullRequest }>('pullRequest')
    if (!annotationObject) {
      throw new NotFoundError('Pull request annotation object not found.')
    }
    return annotationObject
  }

  async getPullRequestAnnotationByExistingAnnotation (pullRequest: HydratedDocument<IPullRequest>, annotation: PopulatedAnnotation) {
    const annotationObject = await PullRequestAnnotation.findOne({
      pullRequest: pullRequest._id,
      targetedAnnotation: annotation._id,
    })
      .populate<{ pullRequest: IPullRequest }>('pullRequest')
    if (!annotationObject) {
      throw new NotFoundError('Pull request annotation object not found.')
    }
    return annotationObject
  }

  async editPullRequestAnnotation (pullRequestAnnotation: PopulatedPullRequestAnnotationObject, data: IPullRequestAnnotationInfo) {
    pullRequestAnnotation.newAnnotation = data
    await pullRequestAnnotation.save()
  }

  async deletePullRequestAnnotation (pullRequestAnnotation: PopulatedPullRequestAnnotationObject) {
    await pullRequestAnnotation.deleteOne()
  }

  async editExistingAnnotation (pullRequest: HydratedDocument<IPullRequest>,
    annotation: PopulatedAnnotation, data: IPullRequestAnnotationInfo) {
    return PullRequestAnnotation.findOneAndReplace({
      pullRequest: pullRequest._id,
      targetedAnnotation: annotation._id,
    }, {
      pullRequest: pullRequest._id,
      targetedAnnotation: annotation._id,
      newAnnotation: data,
    }, {
      runValidators: true,
      upsert: true,
      new: true,
    })
  }

  async deleteExistingAnnotation (pullRequest: HydratedDocument<IPullRequest>,
    annotation: PopulatedAnnotation) {
    await PullRequestAnnotation.findOneAndReplace({
      pullRequest: pullRequest._id,
      targetedAnnotation: annotation._id,
    }, {
      pullRequest: pullRequest._id,
      targetedAnnotation: annotation._id,
      newAnnotation: undefined,
    }, {
      new: true,
      upsert: true,
      runValidators: true,
    })
  }
  async revertExistingAnnotation (pullRequest: HydratedDocument<IPullRequest>,
    annotation: PopulatedAnnotation) {
    await PullRequestAnnotation.deleteOne({
      pullRequest: pullRequest._id,
      targetedAnnotation: annotation._id,
    })
  }
}