import AbstractService from '@/utils/artifacts/AbstractService'
import UserRepository from '@/domains/users/repository'
import { ObjectId } from '@/utils/abbreviations'
import * as console from 'console'
import { rpcBillingMicroserviceClient } from '@/utils/rpc/rpcClient'

export class UserService extends AbstractService {
  repo = new UserRepository()

  async changeEmail (email: string) {
    await this.repo.changeEmail(this.user, email)
  }

  async searchRedactedUsers (params: {
    query?: string
  }) {
    return await this.repo.searchRedactedUsers({
      query: params.query
    })
  }

  async getRedactedUser (userId: ObjectId) {
    return await this.repo.findRedactedUserById(userId)
  }

  async getUser (userId: ObjectId) {
    return await this.repo.findUserById(userId)
  }

  async getRedactedUserByUsername (username: string) {
    return await this.repo.findRedactedUserByUsername(username)
  }

  async getUserByUsername (username: string) {
    return await this.repo.findUserByUsername(username)
  }

  async changeLinks (linksObj: Object) {
    return await this.repo.changeLinks(this.user, linksObj)
  }

  async changeUsername (newUsername: string) {
    await this.repo.changeUsername(this.user, newUsername)
  }

  async addFollower (followee: string) {
    return await this.repo.addFollower(this.user, followee)
  }

  async removeFollower (followee: string) {
    return await this.repo.removeFollower(this.user, followee)
  }

  async changePassword (parameters: {
    oldPassword?: string,
    newPassword: string,
  }) {
    await this.repo.changePassword(this.user, parameters)
  }

  async verifyEmail (code: string) {
    await this.repo.verifyEmail(this.user, code)
  }

  async changeProfilePhoto (file: Express.Multer.File) {
    await this.repo.changeProfilePhoto(this.user, file)
  }

  async changeHeaderPhoto (file: Express.Multer.File) {
    await this.repo.changeHeaderPhoto(this.user, file)
  }

  async getPayoutOnboardingLink (params: {
    returnUrl?: string,
  }) {
    return await rpcBillingMicroserviceClient.request('billingAccounts:onboard', {
      returnUrl: params.returnUrl
    }, { user: this.user })
  }

  async getPayoutDashboardLink () {
    return await rpcBillingMicroserviceClient.request('billingAccounts:dashboard', {}, { user: this.user })
  }

  async getPayoutOnboardingState () {
    return await rpcBillingMicroserviceClient.request('billingAccounts:getOnboardingState', {}, { user: this.user })
  }

  async getCustomerPortalLink (params: {
    returnUrl?: string,
  }) {
    return await rpcBillingMicroserviceClient.request('billingCustomers:portal', {
      returnUrl: params.returnUrl
    }, { user: this.user })
  }
}
