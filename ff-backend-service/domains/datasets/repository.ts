import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import mongoose, { HydratedDocument } from 'mongoose'
import Dataset, { IDataset } from './model'
import {
  NotFoundError,
  PurchaseUnavailableError,
  UserMismatchError,
} from '@/utils/errors'
import AssetRepository from '@/domains/assets/repository'
import { ObjectId } from '@/utils/abbreviations'
import RecipeRepository from '@/domains/recipes/repository'
import { IUser } from '@/domains/users/models/UserModel'
import { IRecipe } from '@/domains/recipes/model'
import stripe from '@/domains/payments/stripe'
import * as process from 'process'
import DatasetPermission from '@/domains/datasets/permissions/model'
import Stripe from 'stripe'
import {
  expandCollectionIntoOneField, expandCollectionIntoOneFieldWithOneField,
} from '@/utils/repoUtils'
import AnnotationRepository from '@/domains/annotations/repository'
import { changePermissionOfObject, deleteMany, getSignedUrlOfObject, upload } from '@/services/bucketService'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import { aggregate } from 'mongo-cursor-pagination'
import DatasetLike from '@/domains/datasets/like/model'
import Activity from '@/domains/datasets/metrics/model'
import { randomUUID } from 'crypto'
import { createDatasetSearchPipeline } from '@/domains/datasets/utils'
import { rpcBillingMicroserviceClient } from '@/utils/rpc/rpcClient'

export default class DatasetRepository extends AbstractRepository {
  async getDatasetById (id: ObjectId) {
    const dataset = await Dataset.findById(id)
    if (!dataset) throw new NotFoundError('Dataset not found.')
    return dataset
  }

  async createDataset (
    dependencies: {
      recipe: HydratedDocument<IRecipe>;
    },
    createParams: Partial<IDataset>
  ) {
    const datasetEntity = new Dataset({
      ...createParams,
      recipe: dependencies.recipe._id,
      // Managed by another microservice, free by default.
      price: 0,
    })
    await datasetEntity.validate()
    await new RecipeRepository().lockRecipe(dependencies.recipe)
    await datasetEntity.save()
    return datasetEntity
  }

  async searchDatasets (query: {
    paid?: boolean;
    public?: boolean;
    user?: mongoose.Types.ObjectId;
    recipe?: ObjectId;
    name?: string;
    sort?: Express.RequestSort;
    pagination?: Express.RequestPagination;
  }) {
    const collection = Dataset.collection
    const aggregationPipeline = createDatasetSearchPipeline(query)
    if (query.sort?.field === 'likes') {
      aggregationPipeline.push({
        $lookup: {
          from: DatasetLike.collection.collectionName,
          as: 'likes',
          localField: '_id',
          foreignField: 'dataset',
          pipeline: [{
            $group: {
              _id: '$dataset',
              count: {
                $count: {}
              },
            }
          }]
        }
      }, {
        $set: {
          likes: {
            $first: '$likes.count'
          }
        }
      })
    } else if (query.sort?.field === 'relevance') {
      aggregationPipeline.push({
        $lookup: {
          from: Activity.collection.collectionName,
          as: 'relevance',
          localField: '_id',
          foreignField: 'dataset',
          pipeline: [
            {
              $match: query.sort.relevancePeriod ? {
                date: {
                  $gte: query.sort.relevancePeriod
                }
              } : {}
            },
            {
              $group: {
                _id: '$dataset',
                sum: {
                  $sum: '$count',
                },
              }
            }
          ]
        }
      }, {
        $set: {
          relevance: {
            $first: '$relevance.sum'
          }
        }
      })
    }
    const { results, ...meta } = await aggregate<IDataset>(
      collection,
      {
        limit: query.pagination?.limit ?? 20,
        aggregation: aggregationPipeline,
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

  async getDatasets (query: {
    user?: mongoose.Types.ObjectId;
    pagination?: Express.RequestPagination;
  }) {
    let limit = query.pagination?.limit ?? 10
    const internalQuery: {
      user?: mongoose.Types.ObjectId;
    } = {}
    if (query.user) {
      internalQuery.user = query.user
    }
    const { results, ...meta } = await Dataset.paginate({
      query: internalQuery,
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    return {
      meta,
      data: results,
    }
  }

  verifyDatasetOwner<D extends IDataset, U extends IUser> (dataset: D, user: U) {
    if (!dataset.user.equals(user._id)) {
      throw new UserMismatchError('You do not own this dataset.')
    }
  }

  async removeDataset (dataset: HydratedDocument<IDataset>) {
    await new AssetRepository().deleteAssetsByDataset(dataset)
    if (dataset.thumbnail) {
      await deleteMany(undefined, [dataset.thumbnail.assetKey.toString()])
    }
    if (dataset.icon) {
      await deleteMany(undefined, [dataset.icon.assetKey.toString()])
    }
    await dataset.remove()
  }

  async editDatasetThumbnail (dataset: HydratedDocument<IDataset>, file: Express.Multer.File) {
    if (dataset.thumbnail) {
      await deleteMany(undefined, [dataset.thumbnail.assetKey.toString()])
    }
    const newAssetKey = `datasetsThumbnails/${randomUUID()}`
    const result = await upload(undefined, file.buffer, {
      fileName: newAssetKey,
      contentType: file.mimetype,
    })
    await changePermissionOfObject(undefined, newAssetKey, 'public-read')
    dataset.thumbnail = {
      assetKey: newAssetKey,
      url: result.Location,
    }
    await dataset.save()
  }

  async editDatasetIcon (dataset: HydratedDocument<IDataset>, file: Express.Multer.File) {
    if (dataset.icon) {
      await deleteMany(undefined, [dataset.icon.assetKey.toString()])
    }
    const newAssetKey = `datasetsIcons/${randomUUID()}`
    const result = await upload(undefined, file.buffer, {
      fileName: newAssetKey,
      contentType: file.mimetype,
    })
    await changePermissionOfObject(undefined, newAssetKey, 'public-read')
    dataset.icon = {
      assetKey: newAssetKey,
      url: result.Location,
    }
    await dataset.save()
  }

  async changeDatasetPrice (
    dataset: HydratedDocument<IDataset>,
    newPrice: number
  ) {
    await rpcBillingMicroserviceClient.request('datasetProduct:changePrice', {
      price: newPrice,
      id: dataset._id.toString(),
    }, {})
    dataset.price = newPrice
    await dataset.save()
  }

  async changeDatasetPublicVisibility (
    dataset: HydratedDocument<IDataset>,
    publiclyVisible: boolean
  ) {
    dataset.public = publiclyVisible
    await dataset.save()
  }

  async createDatasetPurchaseSession (
    dataset: HydratedDocument<IDataset>,
    user: IUser
  ) {
    return await rpcBillingMicroserviceClient.request('datasetProduct:checkout', {
      id: dataset._id
    }, {
      user: user,
    })
  }

  async editDataset (
    dataset: HydratedDocument<IDataset>,
    params: {
      name?: string;
      tags?: string[];
      subTags?: string[];
      description?: string;
    }
  ) {
    if (params.name) {
      dataset.name = params.name
    }
    if (params.tags) {
      dataset.tags = params.tags
    }
    if (params.subTags) {
      dataset.subTags = params.subTags
    }
    if (params.description) {
      dataset.description = params.description
    }
    await dataset.save()
  }

  async updateDataset<T extends IDataset> (dataset: T) {
    await Dataset.updateOne(
      {
        _id: dataset._id,
      },
      {
        $set: {
          updatedAt: new Date(),
        },
      }
    )
  }

  async expandDatasetObjects<T extends IDataset> (
    datasets: T[],
    params: {
      expand: string[],
      user?: Express.User
    }
  ) {
    let result: (IDataset & {
      likes?: number,
      permission?: string,
    })[] = datasets.map((item) => Dataset.hydrate(item).toObject({
      depopulate: true,
    }))
    if (params.expand.includes('user')) {
      result = await Dataset.populate(result, 'user')
    }
    if (params.expand.includes('recipe')) {
      result = await Dataset.populate(result, 'recipe')
    }
    if (params.expand.includes('likes')) {
      result = await Dataset.populate(result, 'likes')
    }
    if (params.expand.includes('contributors')) {
      result = await Dataset.populate(result, 'contributors')
    }
    if (params.expand.includes('assetCounts')) {
      const assetCounts =
        await new AssetRepository().aggregateAssetCountsByDatasets(datasets)
      result = expandCollectionIntoOneField({
        localCollection: result,
        foreignCollection: assetCounts,
        foreignKey: 'dataset',
        localKey: '_id',
        path: 'assetCounts',
      })
    }
    if (params.expand.includes('annotationCounts')) {
      const annotationCounts =
        await new AnnotationRepository().aggregateAnnotationCountsByDatasets(
          datasets
        )
      result = expandCollectionIntoOneField({
        localCollection: result,
        foreignCollection: annotationCounts,
        foreignKey: 'dataset',
        localKey: '_id',
        path: 'annotationCounts',
      })
    }
    if (params.expand.includes('size')) {
      const assetSizes =
        await new AssetRepository().aggregateTotalSizesByDatasets(datasets)
      result = expandCollectionIntoOneField({
        localCollection: result,
        foreignCollection: assetSizes,
        foreignKey: 'dataset',
        localKey: '_id',
        path: 'size',
      })
    }
    if (params.expand.includes('permission')) {
      const permissions =
        await new DatasetPermissionRepository().aggregateDatasetPermissionsByDatasets(datasets, params.user)
      result = expandCollectionIntoOneFieldWithOneField({
        localCollection: result,
        foreignCollection: permissions,
        foreignKey: 'dataset',
        localKey: '_id',
        path: 'permission',
        extractPath: 'role',
      })
    }
    return result
  }

  async incrementViews (dataset: HydratedDocument<IDataset>) {
    await dataset.updateOne({
      $inc: {
        'metrics.views': 1,
      }
    })
  }

  async incrementDownloads (dataset: HydratedDocument<IDataset>) {
    await dataset.updateOne({
      $inc: {
        'metrics.downloads': 1,
      }
    })
  }

  async transferDatasetOwnership (dataset: HydratedDocument<IDataset>, user: IUser) {
    dataset.user = user._id
    await dataset.save()
  }

  async changeDatasetLicense (dataset: HydratedDocument<IDataset>, license: Flockfysh.DatasetLicense) {
    dataset.license = license
    await dataset.save()
  }
}
