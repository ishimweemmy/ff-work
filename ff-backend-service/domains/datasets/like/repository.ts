import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { HydratedDocument } from 'mongoose'
import { ObjectId } from '@/utils/abbreviations'
import DatasetLike from './model'
import { IDataset } from '../model'

export default class DatasetLikeRepository extends AbstractRepository {
  async getLikeCountOfDataset (dataset: HydratedDocument<IDataset>) {
    return DatasetLike.findOne({
      dataset: dataset._id,
    }).count()
  }

  async checkIfDatasetLiked (dataset: HydratedDocument<IDataset>, user: Express.User) {
    return !!(await DatasetLike.findOne({
      dataset: dataset._id,
      user: user._id,
    }))
  }

  async likeDataset (dataset: HydratedDocument<IDataset>, user: Express.User) {
    const liked = await this.checkIfDatasetLiked(dataset, user)
    if (liked) return
    await DatasetLike.create({
      dataset: dataset._id,
      user: user._id,
    })
  }

  async unlikeDataset (dataset: HydratedDocument<IDataset>, user: Express.User) {
    const liked = await this.checkIfDatasetLiked(dataset, user)
    if (!liked) return
    await DatasetLike.deleteMany({
      dataset: dataset._id,
      user: user._id,
    })
  }
}
