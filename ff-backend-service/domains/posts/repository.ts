import Post, { IPost } from '@/domains/posts/model'
import { HydratedDocument } from 'mongoose'
import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { ObjectId } from '@/utils/abbreviations'
import {
    NotFoundError,
  } from '@/utils/errors'

export default class PostRepository extends AbstractRepository {
  async createPost (post: Partial<IPost>): Promise<HydratedDocument<IPost>> {
    return await new Post(post).save()
  }
  
  async updatePost (id: ObjectId, post: Object) {
    await Post.findByIdAndUpdate(id, post)
    const res = await Post.findById(id)
    return res
  }

  async deletePost (id: ObjectId) {
    await Post.deleteOne({_id: id})
  }
  
  async getPosts () {
    const res = await Post.find()
    return res
  }
  
  async getPost (id: ObjectId) {
    const post = await Post.findById(id)
    if (!post) throw new NotFoundError('Post not found.')
    return post
  }

}
