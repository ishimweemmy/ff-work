import AbstractService from '@/utils/artifacts/AbstractService'
import PullRequestMessageRepository from './repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import { ObjectId } from '@/utils/abbreviations'
import DatasetRepository from '@/domains/datasets/repository'
import PullRequestRepository from '../repository'
import { IPullRequestMessage } from '@/domains/pullRequests/messages/model'

export default class PullRequestMessageService extends AbstractService {
  repo = new PullRequestMessageRepository()
  pullRequestRepo = new PullRequestRepository()
  datasetRepo = new DatasetRepository()

  async createPullRequestMessage (
    pullRequestId: ObjectId,
    parameters: {
      message: string
    }
  ) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'read')
    return await this.repo.createPullRequestMessage({
      message: parameters.message,
      pullRequest: pullRequest,
      user: this.user
    })
  }

  async getPullRequestMessages (
    pullRequestId: ObjectId,
    query: {
      pagination?: Express.RequestPagination,
      sort?: Express.RequestSort<IPullRequestMessage>
      expand: string[]
    }
  ) {
    const pullRequest = await this.pullRequestRepo.getPullRequestById(pullRequestId)
    await this.pullRequestRepo.requestPullRequestPermission(pullRequest, this.user, 'read')
    const page = await this.repo.getPullRequestMessages(pullRequest, {
      sort: query.sort,
      pagination: query.pagination
    })
    const expanded = await this.repo.expandPullRequestMessages(page.data, query.expand)
    return {
      data: expanded,
      meta: page.meta,
    }
  }

  async editPullRequestMessage (
    id: ObjectId,
    parameters: {
      message: string
    }
  ) {
    const pullRequestMessage = await this.repo.getPullRequestMessageById(id)
    await this.repo.requestPullRequestMessagePermission(pullRequestMessage, this.user, 'edit')
    await this.repo.editPullRequestMessage(pullRequestMessage, parameters)
  }

  async deletePullRequestMessage (id: ObjectId) {
    const pullRequestMessage = await this.repo.getPullRequestMessageById(id)
    try {
      await this.repo.requestPullRequestMessagePermission(pullRequestMessage, this.user, 'edit')
    } catch (e) {
      await this.repo.requestPullRequestMessagePermission(pullRequestMessage, this.user, 'moderate')
    }
    await this.repo.deletePullRequestMessage(pullRequestMessage)
  }
}
