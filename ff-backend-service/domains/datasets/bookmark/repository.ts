import mongoose, { HydratedDocument } from 'mongoose'
import { aggregate } from 'mongo-cursor-pagination'
import { ObjectId } from '@/utils/abbreviations'
import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import DatasetBookmark from './model'
import Dataset, { IDataset } from '../model'

export default class DatasetBookmarkRepository extends AbstractRepository {
  async getBookmarkCountOfDataset (dataset: HydratedDocument<IDataset>) {
    return DatasetBookmark.findOne({
      dataset: dataset._id,
    }).count()
  }

  async checkIfDatasetBookmarked (dataset: HydratedDocument<IDataset>, user: Express.User) {
    return !!(await DatasetBookmark.findOne({
      dataset: dataset._id,
      user: user._id,
    }))
  }

  async bookmarkDataset (dataset: HydratedDocument<IDataset>, user: Express.User) {
    const bookmarked = await this.checkIfDatasetBookmarked(dataset, user)
    if (bookmarked) return
    await DatasetBookmark.create({
      dataset: dataset._id,
      user: user._id,
    })
  }

  async unbookmarkDataset (dataset: HydratedDocument<IDataset>, user: Express.User) {
    const bookmarked = await this.checkIfDatasetBookmarked(dataset, user)
    if (!bookmarked) return
    await DatasetBookmark.deleteMany({
      dataset: dataset._id,
      user: user._id,
    })
  }

  
  async getBookmarkedDatasets (query: {
    user: ObjectId;
    paid?: boolean;
    public?: boolean;
    recipe?: ObjectId;
    name?: string;
    sort?: Express.RequestSort;
    pagination?: Express.RequestPagination;
  }) {
    const bookmarkCollection = DatasetBookmark.collection

    const matchStage: {
      public?: boolean,
      recipe?: ObjectId;
      $text?: {
        $search: string;
      };
      price?: number | {
        $gt: number;
      };
    } = {}

    if (query.name) {
      matchStage.$text = {
        $search: query.name
      }
    }
    if (query.recipe) {
      matchStage.recipe = query.recipe
    }
    if (query.public !== undefined) {
      matchStage.public = query.public
    }
    if (query.paid === true) {
      matchStage.price = {
        $gt: 0,
      }
    } else if (query.paid === false) {
      matchStage.price = 0
    }

    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          user: query.user,
          role: {
            $ne: 'blocked',
          }
        }
      },
      {
        $lookup: {
          from: Dataset.collection.collectionName,
          foreignField: '_id',
          localField: 'dataset',
          as: 'datasets',
        }
      },
      {
        $project: {
          dataset: {
            $first: '$datasets',
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: '$dataset',
        }
      },
      {
        $match: matchStage,
      }
    ]

    const { results, ...meta } = await aggregate<IDataset>(
      bookmarkCollection,
      {
        limit: query.pagination?.limit ?? 20,
        aggregation: pipeline,
        next: query.pagination?.next,
        previous: query.pagination?.previous,
        sortAscending: query.sort?.ascending,
        paginatedField: query.sort?.field,
      },
    )
    return {
      meta,
      data: results,
    }
  }
}
