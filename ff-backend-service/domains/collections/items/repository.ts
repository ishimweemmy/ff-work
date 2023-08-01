import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import mongoose, { HydratedDocument } from 'mongoose'
import { ICollection } from '@/domains/collections/model'
import Dataset, { IDataset } from '@/domains/datasets/model'
import CollectionItem from '@/domains/collections/items/model'
import { ObjectId } from '@/utils/abbreviations'
import { createDatasetSearchPipeline } from '@/domains/datasets/utils'
import { aggregate } from 'mongo-cursor-pagination'
import { InvalidArgumentsError } from '@/utils/errors'
import { DatasetRepositorySearchQuery } from '@/domains/datasets/queries'

export default class CollectionItemRepository extends AbstractRepository {
  async addDataset (collection: HydratedDocument<ICollection>, dataset: HydratedDocument<IDataset>) {
    const entry = await CollectionItem.findOne({
      dataset: dataset._id,
      collection: collection._id,
    })
    if (entry) {
      throw new InvalidArgumentsError('Dataset already added to collection')
    }
    return await CollectionItem.create({
      dataset: dataset._id,
      collection: collection._id,
    })
  }

  async deleteDataset (collection: HydratedDocument<ICollection>, dataset: HydratedDocument<IDataset>) {
    await CollectionItem.deleteOne({
      dataset: dataset._id,
      collection: collection._id
    })
  }

  async searchDatasets (collection: HydratedDocument<ICollection>, query: DatasetRepositorySearchQuery) {
    const dbCollection = CollectionItem.collection
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          collection: collection._id
        }
      },
      {
        $lookup: {
          from: Dataset.collection.collectionName,
          localField: 'dataset',
          foreignField: '_id',
          as: 'datasets'
        }
      },
      {
        $project: {
          dataset: {
            $first: '$datasets'
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: '$dataset',
        }
      },
      ...createDatasetSearchPipeline(query)
    ]
    const { results, ...meta } = await aggregate(dbCollection, {
      aggregation: pipeline,
      sortAscending: query.sort?.ascending,
      paginatedField: query.sort?.field,
      limit: query.pagination?.limit ?? 10,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    return {
      meta: meta,
      data: results.map(item => Dataset.hydrate(item)),
    }
  }
}
