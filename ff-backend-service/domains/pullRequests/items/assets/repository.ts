import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { HydratedDocument } from 'mongoose'
import PullRequest, { IPullRequest } from '@/domains/pullRequests/model'
import { uploadImage } from '@/domains/assets/repoUtils'
import PullRequestAsset, { IPullRequestAsset } from '@/domains/pullRequests/items/assets/assetModel'
import PullRequestDeleteAsset from '@/domains/pullRequests/items/assets/deleteAssetModel'
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import * as config from '@/utils/config'
import * as process from 'process'
import { ObjectId } from '@/utils/abbreviations'
import Asset, { IAsset } from '@/domains/assets/model'
import AssetRepository, { PopulatedAsset } from '@/domains/assets/repository'
import { InvalidOperationError, NotFoundError } from '@/utils/errors'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { aggregate } from 'mongo-cursor-pagination'
import PullRequestAnnotation from '@/domains/pullRequests/items/annotations/model'
import Annotation from '@/domains/annotations/model'
import * as bucketService from '@/services/bucketService'
import DatasetRepository from '@/domains/datasets/repository'

const s3 = new S3Client(config.S3_CONFIG)

export type PopulatedPullRequestAsset = Awaited<ReturnType<typeof PullRequestAssetRepository.prototype.getNewAssetInPullRequestById>>
const datasetRepo = new DatasetRepository()

export default class PullRequestAssetRepository extends AbstractRepository {
  async addImageToPullRequest (pullRequest: HydratedDocument<IPullRequest>, image: Express.Multer.File): Promise<HydratedDocument<IPullRequestAsset>> {
    const imageId = new ObjectId()
    const asset = new PullRequestAsset({
      pullRequest: pullRequest._id,
      size: image.size,
      _id: imageId,
      type: 'image',
      displayName: image.originalname,
      mimetype: 'image/jpeg',
    })
    await asset.validate()
    await uploadImage(imageId, image)
    return await asset.save()
  };

  async addMiscAssetToPullRequest (pullRequest: HydratedDocument<IPullRequest>, asset: Express.Multer.File): Promise<HydratedDocument<IPullRequestAsset>> {
    const assetBuffer = asset.buffer
    const assetId = new ObjectId()
    const readyAsset = new PullRequestAsset({
      pullRequest: pullRequest._id,
      size: asset.size,
      _id: assetId,
      type: 'other',
      displayName: asset.originalname,
      mimetype: asset.mimetype,
    })
    await readyAsset.validate()
    await bucketService.upload(undefined, assetBuffer, {
      fileName: assetId.toString(),
      contentType: asset.mimetype,
    })
    return await readyAsset.save()
  };

  async addTextAssetToPullRequest (pullRequest: HydratedDocument<IPullRequest>, asset: Express.Multer.File): Promise<HydratedDocument<IPullRequestAsset>> {
    const assetBuffer = asset.buffer
    const assetId = new ObjectId()
    const readyAsset = new PullRequestAsset({
      pullRequest: pullRequest._id,
      size: asset.size,
      _id: assetId,
      type: 'text',
      displayName: asset.originalname,
      mimetype: asset.mimetype,
    })
    await readyAsset.validate()
    await bucketService.upload(undefined, assetBuffer, {
      fileName: assetId.toString(),
      contentType: asset.mimetype,
    })
    return await readyAsset.save()
  };

  async getS3UrlOfPullRequestAsset<T extends IPullRequestAsset> (asset: T) {
    const getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: asset._id.toString(),
    }
    const command = new GetObjectCommand(getObjectParams)
    return await getSignedUrl(s3, command, { expiresIn: 86400 })
  }

  async getNewAssetInPullRequestById (id: ObjectId) {
    const targetedAsset = await PullRequestAsset.findById(id).populate<{ pullRequest: IPullRequest }>('pullRequest')
    if (!targetedAsset) {
      throw new NotFoundError('Asset cannot be found.')
    }
    return targetedAsset
  };

  async deleteNewAssetFromPullRequest (asset: PopulatedPullRequestAsset): Promise<void> {
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: asset._id.toString(),
    }))

    await asset.deleteOne()
  };

  async queueDeletionOfExistingAsset (pullRequest: HydratedDocument<IPullRequest>, asset: PopulatedAsset): Promise<void> {
    const stored = await PullRequestDeleteAsset.findOne({
      pullRequest: pullRequest._id,
      targetedAsset: asset._id,
    })
    if (stored) return
    else {
      await PullRequestDeleteAsset.create({
        pullRequest: pullRequest._id,
        targetedAsset: asset._id,
        itemType: 'deleteAsset',
      })
    }
  };

  async unQueueDeletionOfExistingAsset (pullRequest: HydratedDocument<IPullRequest>, asset: PopulatedAsset): Promise<void> {
    await PullRequestDeleteAsset.deleteMany({
      pullRequest: pullRequest._id,
      targetedAsset: asset._id,
    })
  };

  async expandPullRequestAssets<T extends IPullRequestAsset> (asset: T[], expand: string[]) {
    let result = asset.map(item => PullRequestAsset.hydrate(item).toObject({
      depopulate: true,
      virtuals: false,
    }))
    if (expand.includes('annotationData')) {
      result = await PullRequestAsset.populate(result, 'annotationData')
    }
    return result
  }

  async expandExistingAssetsInPullRequest<T extends IAsset> (pullRequest: HydratedDocument<IPullRequest>, assets: T[], expand: string[]) {
    let result = assets.map(item => Asset.hydrate(item).toObject({
      depopulate: true,
      virtuals: false,
    }))
    if (expand.includes('annotationData')) {
      result = await Asset.populate(result, 'annotationData')
    }
    if (expand.includes('pullRequestAnnotationData')) {
      result = await Asset.populate(result, {
        path: 'pullRequestAnnotationData',
        match: {
          pullRequest: pullRequest._id
        }
      })
    }
    return result
  }

  async searchPullRequestAssetsByPullRequest (pullRequest: HydratedDocument<IPullRequest>, query: {
    displayName?: string,
    pagination?: Express.RequestPagination,
  }) {
    let limit = query.pagination?.limit ?? 50
    const internalQuery: {
      pullRequest: ObjectId;
      displayName?: {
        $regex: string,
      };
    } = {
      pullRequest: pullRequest._id,
    }
    if (query.displayName) {
      internalQuery.displayName = { $regex: query.displayName }
    }
    const page = await PullRequestAsset.paginate({
      query: internalQuery,
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    const { results: assetEntities, ...meta } = page
    const promises = assetEntities.map(async (asset) => {
      return {
        ...asset,
        url: await this.getS3UrlOfPullRequestAsset(asset),
      }
    })
    return {
      data: await Promise.all(promises),
      meta: meta
    }
  }

  async searchExistingAssetsAlteredByPullRequest (pullRequest: HydratedDocument<IPullRequest>, query: {
    displayName?: string,
    stage?: string,
    pagination?: Express.RequestPagination,
  }) {
    let limit = query.pagination?.limit ?? 50
    const internalQuery: {
      stage?: string;
      displayName?: {
        $regex: string,
      };
    } = {}
    const page = await aggregate<IAsset>(PullRequestAnnotation.collection, {
      aggregation: [
        {
          $match: {
            pullRequest: pullRequest._id
          },
        },
        {
          $lookup: {
            from: Annotation.collection.collectionName,
            localField: 'targetedAnnotation',
            foreignField: '_id',
            as: 'targetedAnnotation',
          }
        },
        {
          $project: {
            targetedAnnotation: {
              $first: '$targetedAnnotation',
            },
            targetedAsset: 1,
          }
        },
        {
          $set: {
            targetedAsset: {
              $ifNull: ['$targetedAsset', '$targetedAnnotation.asset']
            }
          }
        },
        {
          $group: {
            _id: '$targetedAsset',
          }
        },
        {
          $match: {
            _id: {
              $ne: null,
            }
          }
        },
        {
          $lookup: {
            from: Asset.collection.collectionName,
            localField: '_id',
            foreignField: '_id',
            as: 'asset',
          }
        },
        {
          $project: {
            asset: {
              $first: '$asset',
            }
          }
        },
        {
          $replaceRoot: {
            newRoot: '$asset',
          }
        },
        {
          $match: internalQuery,
        }
      ],
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    const { results: assetEntities, ...meta } = page
    const promises = assetEntities.map(async (asset) => {
      return {
        ...asset,
        url: await new AssetRepository().getS3UrlOfAsset(asset),
      }
    })
    return {
      data: await Promise.all(promises),
      meta: meta
    }
  }

  async searchExistingAssetsDeletedByPullRequest (pullRequest: HydratedDocument<IPullRequest>, query: {
    displayName?: string,
    stage?: string,
    pagination?: Express.RequestPagination,
  }) {
    let limit = query.pagination?.limit ?? 50
    const internalQuery: {
      stage?: string;
      displayName?: {
        $regex: string,
      };
    } = {}
    const page = await aggregate<IAsset>(PullRequestDeleteAsset.collection, {
      aggregation: [
        {
          $match: {
            pullRequest: pullRequest._id
          },
        },
        {
          $group: {
            _id: '$targetedAsset',
          }
        },
        {
          $match: {
            _id: {
              $ne: null,
            }
          }
        },
        {
          $lookup: {
            from: Asset.collection.collectionName,
            localField: '_id',
            foreignField: '_id',
            as: 'asset',
          }
        },
        {
          $project: {
            asset: {
              $first: '$asset',
            }
          }
        },
        {
          $replaceRoot: {
            newRoot: '$asset',
          }
        },
        {
          $match: internalQuery,
        }
      ],
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    const { results: assetEntities, ...meta } = page
    const promises = assetEntities.map(async (asset) => {
      return {
        ...asset,
        url: await new AssetRepository().getS3UrlOfAsset(asset),
      }
    })
    return {
      data: await Promise.all(promises),
      meta: meta
    }
  }
}
