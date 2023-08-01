import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { ObjectId } from '@/utils/abbreviations'
import User from '@/domains/users/models/UserModel'
import { NotFoundError, PermissionError, AlreadyFollowedError, AlreadyUnfollowedError } from '@/utils/errors'
import { generate } from 'otp-generator'
import * as bucketService from '@/services/bucketService'
import * as config from '@/utils/config'
import { v4 } from 'uuid'
import axios from 'axios'
import RedactedUser, { IRedactedUser, redactUserPipeline } from '@/domains/users/models/RedactedUserModel'
import { query } from 'express'
import { aggregate } from 'mongo-cursor-pagination'

export default class UserRepository extends AbstractRepository {
  async findUserById (id: ObjectId) {
    const result = await User.findById(id)
    if (!result) {
      throw new NotFoundError('User not found!')
    }
    return result
  }

  async findUserByEmail (email: string) {
    const result = await User.findOne({
      email: email,
    })
    if (!result) {
      throw new NotFoundError('User not found!')
    }
    return result
  }

  async findUserByUsername (username: string) {
    const result = await User.findOne({
      username: username,
    })
    if (!result) {
      throw new NotFoundError('User not found!')
    }
    return result
  }

  async findRedactedUserById (id: ObjectId) {
    const result = await RedactedUser.findById(id)
    if (!result) {
      throw new NotFoundError('User not found!')
    }
    return result
  }

  async findRedactedUserByUsername (username: string) {
    const result = await RedactedUser.findOne({
      username: username
    })
    if (!result) {
      throw new NotFoundError('User not found!')
    }
    return result
  }

  async addFollower (user: Express.User, username: string) {
    const followingUser = await User.findOne({
      username: username,
    }).exec()

    if (!followingUser) {
      throw new NotFoundError('User not found!')
    }

    const followingId = followingUser._id
    if (!followingUser.followers?.includes(user._id)) {
      // add following id to the user
      user.followings?.push(followingId)
      await user.save()
      // add user id to following user
      followingUser.followers?.push(user._id)
      await followingUser?.save()
      return followingUser
    } else {
      throw new AlreadyFollowedError()
    }
  }
  
  async removeFollower (user: Express.User, username: string) {
    const followingUser = await User.findOne({
      username: username,
    }).exec()

    if (!followingUser) {
      throw new NotFoundError('User not found!')
    }

    const followingId = followingUser._id
    if (followingUser.followers?.includes(user._id)) {
      // add following id to the user
      await User.updateOne({ _id: user._id  }, {
        $pullAll: {
            followings: [followingId],
        },
      });
      await User.updateOne({ _id:  followingId }, {
        $pullAll: {
            followers: [user._id],
        },
      });
      const followingUser = await User.findOne({
        username: username,
      }).exec()
      return followingUser
    } else {
      throw new AlreadyUnfollowedError()
    }
  }

  async changeLinks (user: Express.User, updatedData: Object) {
    await User.findByIdAndUpdate(user._id, { links: updatedData })
    const res = await User.findById(user._id)
    return res?.links
  }

  async changePassword (user: Express.User, parameters: {
    oldPassword?: string,
    newPassword: string,
  }) {
    // Set password for the first time if password login is not available yet.
    if (!user.hash || !user.salt) {
      await user.setPassword(parameters.newPassword)
    }
    if (!parameters.oldPassword) {
      throw new PermissionError('You must specify old password.')
    } else {
      await user.changePassword(parameters.oldPassword, parameters.newPassword)
    }
  }

  async verifyEmail (user: Express.User, code: string) {
    if (user.verification.verificationCode === code) {
      if (user.verification.newEmail) {
        user.email = user.verification.newEmail
      }
      user.verification.verified = true
      delete user.verification.verificationCode
      delete user.verification.newEmail
      await user.save()
    } else {
      throw new PermissionError('Invalid verification code.')
    }
  }

  async changeEmail (user: Express.User, email: string) {
    user.verification.newEmail = email
    user.verification.verificationCode = generate(8, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
    })
    await user.save()
  }

  async changeUserPhotoToUrl (user: Express.User, url: string) {
    const res = await axios.get(url, {
      responseType: 'stream',
    })
    const file = {
      stream: res.data,
      mimetype: res.headers['Content-Type'],
    } as Express.Multer.File
    await this.changeProfilePhoto(user, file)
  }

  async changeHeaderPhotoToUrl (user: Express.User, url: string) {
    const res = await axios.get(url, {
      responseType: 'stream',
    })
    const file = {
      stream: res.data,
      mimetype: res.headers['Content-Type'],
    } as Express.Multer.File
    await this.changeHeaderPhoto(user, file)
  }

  async changeProfilePhoto (user: Express.User, file: Express.Multer.File) {
    const body = file.stream ?? file.buffer
    const key = `profilePhoto/${v4()}`
    if (user.profilePhoto?.assetKey) {
      await bucketService.deleteMany(config.BUCKET_NAME, [user.profilePhoto.assetKey])
    }
    const result = await bucketService.upload(config.BUCKET_NAME, body, {
      contentType: file.mimetype,
      fileName: key,
    })
    await bucketService.changePermissionOfObject(config.BUCKET_NAME, key, 'public-read')
    user.profilePhoto = {
      assetKey: key,
      url: result.Location,
    }
    await user.save()
  }

  async searchRedactedUsers (params: { query?: string, pagination?: Express.RequestPagination }) {
    const { results, ...meta } = await aggregate<IRedactedUser>(User.collection, {
      aggregation: [
        {
          $match: {
            $text: {
              $search: params.query ?? ''
            }
          }
        },
        redactUserPipeline,
      ],
      limit: params.pagination?.limit ?? 10,
      next: params.pagination?.next,
      previous: params.pagination?.previous,
    })
    return {
      data: results,
      meta,
    }
  }

  async changeHeaderPhoto (user: Express.User, file: Express.Multer.File) {
    const buf = file.stream ?? file.buffer
    const key = `headerPhoto/${v4()}`
    if (user.headerPhoto?.assetKey) {
      await bucketService.deleteMany(config.BUCKET_NAME, [user.headerPhoto.assetKey])
    }
    const result = await bucketService.upload(config.BUCKET_NAME, buf, {
      contentType: file.mimetype,
      fileName: key,
    })
    await bucketService.changePermissionOfObject(config.BUCKET_NAME, key, 'public-read')
    user.headerPhoto = {
      assetKey: key,
      url: result.Location,
    }
    await user.save()
  }

  async changeUsername (user: Express.User, newUsername: string) {
    user.username = newUsername
    await user.save()
  }
}