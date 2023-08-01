import { IPost } from "./model";
import ExposedService from '@/utils/artifacts/AbstractService'
import PostRepository from "./repository";
import { ObjectId } from "@/utils/abbreviations";

export default class PostService extends ExposedService {
  repo = new PostRepository()

  async createPost (post: Partial<IPost>) {
    return await this.repo.createPost({
      ...post,
      user: this.user._id
    })
  }

  async updatePost (id: ObjectId, updatedPost: Object) {
    return await this.repo.updatePost(
      id,
      updatedPost
    )
  }

  async deletePost (id: ObjectId) {
    await this.repo.deletePost(id)
  }
  
  async getPosts () {
    return await this.repo.getPosts()
  }
  
  async getPost (id: ObjectId) {
    return await this.repo.getPost(id)
  }
}
