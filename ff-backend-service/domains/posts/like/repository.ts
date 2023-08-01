import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { HydratedDocument } from 'mongoose'
import { ObjectId } from '@/utils/abbreviations'
import PostLike from './model'
import { IPost } from '../model'

export default class PostLikeRepository extends AbstractRepository {
  async getLikeCountOfPost (post: HydratedDocument<IPost>) {
    return PostLike.findOne({
      post: post._id,
    }).count()
  }

  async checkIfPostLiked (post: HydratedDocument<IPost>, user: Express.User) {
    return !!(await PostLike.findOne({
      post: post._id,
      user: user._id,
    }))
  }

  async likePost (post: HydratedDocument<IPost>, user: Express.User) {
    const liked = await this.checkIfPostLiked(post, user)
    if (liked) return
    await PostLike.create({
      post: post._id,
      user: user._id,
    })
  }

  async unlikePost (post: HydratedDocument<IPost>, user: Express.User) {
    const liked = await this.checkIfPostLiked(post, user)
    if (!liked) return
    await PostLike.deleteMany({
      post: post._id,
      user: user._id,
    })
  }
}
