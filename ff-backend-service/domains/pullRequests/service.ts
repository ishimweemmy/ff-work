import AbstractService from '@/utils/artifacts/AbstractService'
import PullRequestRepository from '@/domains/pullRequests/repository'
import { ObjectId } from '@/utils/abbreviations'
import DatasetRepository from '@/domains/datasets/repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import { IPullRequest, PullRequestStatus } from '@/domains/pullRequests/model'

export default class PullRequestService extends AbstractService {
  repo = new PullRequestRepository()
  datasetRepo = new DatasetRepository()
  datasetPermissionRepo = new DatasetPermissionRepository()

  async createPullRequest (datasetId: ObjectId, params: {
    name: string;
    description?: string;
  }) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'contributor',
    })
    return await this.repo.createPullRequest({
      dataset: dataset,
      user: this.user,
      description: params.description,
      name: params.name,
    })
  }

  async getPullRequestById (id: ObjectId, query: {
    expand: string[]
  }) {
    const pr = await this.repo.getPullRequestById(id)
    await this.repo.requestPullRequestPermission(pr, this.user, 'read')
    const result = await this.repo.expandPullRequests([pr], query.expand as (keyof IPullRequest)[])
    return result[0]
  }

  async searchPullRequestsByDatasetId (id: ObjectId, query: {
    name?: string,
    expand: string[],
    pagination?: Express.RequestPagination
  }) {
    const dataset = await this.datasetRepo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'contributor',
    })
    const page = await this.repo.searchPullRequestsByDataset(dataset, {
      name: query.name,
      pagination: query.pagination,
    })
    const result = await this.repo.expandPullRequests(page.data, query.expand as (keyof IPullRequest)[])
    return {
      data: result,
      meta: page.meta,
    }
  }

  async editPullRequest (id: ObjectId, params: {
    name?: string,
  }) {
    const pr = await this.repo.getPullRequestById(id)
    await this.repo.requestPullRequestPermission(pr, this.user, 'write')
    await this.repo.editPullRequest(pr, {
      name: params.name
    })
  }

  async deletePullRequest (id: ObjectId) {
    const pr = await this.repo.getPullRequestById(id)
    await this.repo.requestPullRequestPermission(pr, this.user, 'write')
    await this.repo.deletePullRequest(pr)
  }

  async mergePullRequest (id: ObjectId) {
    const pr = await this.repo.getPullRequestById(id)
    await this.repo.requestPullRequestPermission(pr, this.user, 'review')
    await this.repo.mergePullRequest(pr)
  }

  async changePullRequestStatus (id: ObjectId, status: PullRequestStatus) {
    const pr = await this.repo.getPullRequestById(id)
    if (status === 'merged') {
      await this.repo.requestPullRequestPermission(pr, this.user, 'review')
      await this.repo.mergePullRequest(pr)
    } else if (status === 'rejected') {
      await this.repo.requestPullRequestPermission(pr, this.user, 'review')
      await this.repo.changePullRequestStatus(pr, status)
    } else {
      await this.repo.requestPullRequestPermission(pr, this.user, 'write')
      await this.repo.changePullRequestStatus(pr, status)
    }
  }
}
