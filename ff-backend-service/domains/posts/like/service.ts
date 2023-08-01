import AbstractService from '@/utils/artifacts/AbstractService';
import { ObjectId } from '@/utils/abbreviations';
import PostLikeRepository from './repository';
import PostRepository from '../repository';

export default class PostLikeService extends AbstractService {
  repo = new PostLikeRepository();
  postRepo = new PostRepository();

  async getCount(id: ObjectId) {
    const post = await this.postRepo.getPost(id);
    return this.repo.getLikeCountOfPost(post);
  }

  async checkIfPostLiked(id: ObjectId) {
    const post = await this.postRepo.getPost(id);
    return this.repo.checkIfPostLiked(post, this.user);
  }

  async likePost(id: ObjectId) {
    const post = await this.postRepo.getPost(id);
    return this.repo.likePost(post, this.user);
  }

  async unlikePost(id: ObjectId) {
    const post = await this.postRepo.getPost(id);
    return this.repo.unlikePost(post, this.user);
  }
}
