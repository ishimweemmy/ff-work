import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import mongoose, { HydratedDocument } from 'mongoose'
import { IPullRequest } from '../model'
import PullRequestMessage, { IPullRequestMessage } from './model'
import { ObjectId } from '@/utils/abbreviations'
import { NotFoundError, PermissionError } from '@/utils/errors'
import PullRequestRepository from '@/domains/pullRequests/repository'
import { pull } from 'lodash'
import RedactedUser from '@/domains/users/models/RedactedUserModel'

type PopulatedPullRequestMessage = Awaited<ReturnType<typeof PullRequestMessageRepository.prototype.getPullRequestMessageById>>

export default class PullRequestMessageRepository extends AbstractRepository {
  async createPullRequestMessage (parameters: {
    message: string,
    pullRequest: HydratedDocument<IPullRequest>,
    user: Express.User
  }) {
    return await PullRequestMessage.create({
      message: parameters.message,
      pullRequest: parameters.pullRequest._id,
      user: parameters.user._id
    })
  }

  async getPullRequestMessages (pullRequest: HydratedDocument<IPullRequest>, query: {
    sort?: Express.RequestSort<IPullRequestMessage>;
    pagination?: Express.RequestPagination;
  }) {
    const page = await PullRequestMessage.paginate({
      next: query.pagination?.next,
      previous: query.pagination?.previous,
      limit: query.pagination?.limit ?? 20,
      query: {
        pullRequest: pullRequest._id
      },
      paginatedField: query.sort?.field ?? "_id",
      sortAscending: query.sort?.ascending,
    })
    const { results, ...meta } = page
    return {
      data: results,
      meta,
    }
  }

  async editPullRequestMessage (
    pullRequestMessage: PopulatedPullRequestMessage,
    parameters: {
      message: string
    }
  ) {
    pullRequestMessage.message = parameters.message
    pullRequestMessage.updatedAt = new Date()
    return await pullRequestMessage.save()
  }

  async requestPullRequestMessagePermission (
    pullRequestMessage: PopulatedPullRequestMessage,
    user: Express.User,
    type: 'read' | 'edit' | 'moderate'
  ) {
    if (type === 'read') {
      await new PullRequestRepository().requestPullRequestPermission(pullRequestMessage.pullRequest, user, 'read')
      return
    } else if (type === 'edit') {
      if (!user._id.equals(pullRequestMessage.user._id)) {
        throw new PermissionError('You cannot edit this pull request message.')
      }
      return
    } else if (type === 'moderate') {
      await new PullRequestRepository().requestPullRequestPermission(pullRequestMessage.pullRequest, user, 'review')
      return
    }
  }

  async getPullRequestMessageById (id: ObjectId) {
    const prMessage = await PullRequestMessage.findById(id).populate<{ pullRequest: IPullRequest }>('pullRequest')
    if (!prMessage) throw new NotFoundError('Pull request not found!')
    return prMessage
  }

  async deletePullRequestMessage (
    pullRequestMessage: PopulatedPullRequestMessage
  ) {
    await pullRequestMessage.delete()
  }

  async expandPullRequestMessages<T extends IPullRequestMessage> (
    pullRequestMessages: T[],
    expand: string[]
  ) {
    let results: IPullRequestMessage[] = pullRequestMessages.map(item => PullRequestMessage.hydrate(item).toObject({
      depopulate: true,
    }))
    const expandableKeys: {
      key: keyof IPullRequestMessage,
      model?: mongoose.Model<any>,
    }[] = [{
      key: 'user',
      model: RedactedUser,
    }, {
      key: 'pullRequest',
    }]
    for (let field of expandableKeys) {
      if (expand.includes(field.key)) {
        results = await PullRequestMessage.populate(results, {
          path: field.key,
          model: field.model,
        })
      }
    }
    return results
  }
}
