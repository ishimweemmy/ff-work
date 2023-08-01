import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { IDataset } from '@/domains/datasets/model'
import mongoose, { HydratedDocument } from 'mongoose'
import PullRequest, { IPullRequest, PullRequestStatus } from '@/domains/pullRequests/model'
import { ObjectId } from '@/utils/abbreviations'
import { InvalidOperationError, NotFoundError } from '@/utils/errors'
import RedactedUser from '@/domains/users/models/RedactedUserModel'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import DatasetRepository from '@/domains/datasets/repository'
import { IUser } from '@/domains/users/models/UserModel'
import PullRequestAsset from '@/domains/pullRequests/items/assets/assetModel'
import { S3_CONFIG } from '@/utils/config'
import { CopyObjectCommand, DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3'
import * as process from 'process'
import PullRequestDeleteAsset from '@/domains/pullRequests/items/assets/deleteAssetModel'
import PullRequestAnnotation, { IPullRequestAnnotation } from '@/domains/pullRequests/items/annotations/model'
import Asset, { IAsset } from '@/domains/assets/model'
import Annotation, { IAnnotation } from '@/domains/annotations/model'
import mongodb from 'mongodb'
import * as console from 'console'
import PullRequestMessage from '@/domains/pullRequests/messages/model'
import { getPullRequestById } from '@/domains/pullRequests/controllers'
import { createPullRequestStatsPipeline } from '@/domains/pullRequests/repoUtils'
import { expandCollectionIntoOneField, expandCollectionIntoOneFieldWithOneField } from '@/utils/repoUtils'

const s3 = new S3Client(S3_CONFIG)

export default class PullRequestRepository extends AbstractRepository {
  async createPullRequest (parameters: {
    name: string,
    description?: string,
    dataset: HydratedDocument<IDataset>, user: Express.User,
  }) {
    return await PullRequest.create({
      dataset: parameters.dataset._id,
      user: parameters.user._id,
      name: parameters.name,
      description: parameters.description
    })
  }

  async searchPullRequestsByDataset (dataset: HydratedDocument<IDataset>, query: {
    name?: string,
    pagination?: Express.RequestPagination,
  }) {
    const limit = query.pagination?.limit ?? 20
    const internalQuery: {
      $text?: {
        $search: string,
      },
      dataset: ObjectId,
    } = { dataset: dataset._id }
    if (query.name) {
      internalQuery.$text = {
        $search: query.name,
      }
    }
    const page = await PullRequest.paginate({
      query: internalQuery,
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    const { results: data, ...meta } = page
    return {
      data,
      meta
    }
  }

  async editPullRequest (pullRequest: HydratedDocument<IPullRequest>, parameters: {
    name?: string,
  }) {
    let editableFields: (keyof typeof parameters)[] = ['name']
    for (let fields of editableFields) {
      let value = parameters[fields]
      if (value) {
        pullRequest[fields] = value
      }
    }
    await pullRequest.save()
  }

  async getPullRequestById (id: ObjectId): Promise<HydratedDocument<IPullRequest>> {
    const pr = await PullRequest.findById(id)
    if (!pr) {
      throw new NotFoundError('Pull request not found!')
    }
    return pr
  };

  async expandPullRequests<T extends IPullRequest> (pullRequests: T[], expand: (keyof IPullRequest | string)[]) {
    let results: HydratedDocument<IPullRequest & {
      user: ObjectId | IUser,
      dataset: ObjectId | IDataset,
      stats?: {
        _id: ObjectId;
        messages: number,
        newAssets: number,
        deletedAssets: number,
        changedAssets: number,
      }
    }>[] = pullRequests.map(item => PullRequest.hydrate(item).toObject({
      depopulate: true,
    }))
    const expandableKeys: {
      key: keyof IPullRequest | string,
      model?: mongoose.Model<any>,
      aggregator?: (item: typeof results) => Promise<typeof results>;
    }[] = [{
      key: 'user',
      model: RedactedUser,
    }, {
      key: 'dataset',
    }, {
      key: 'stats',
      aggregator: async (list) => {
        const aggregateResults = await this.getPullRequestStats(list)
        return expandCollectionIntoOneField({
          localCollection: results,
          foreignCollection: aggregateResults,
          foreignKey: '_id',
          localKey: '_id',
          path: 'stats'
        })
      }
    }]
    for (let field of expandableKeys) {
      if (expand.includes(field.key)) {
        if (field.aggregator) {
          results = await field.aggregator(results)
        } else {
          results = await PullRequest.populate(results, {
            path: field.key,
            model: field.model,
          })
        }
      }
    }
    return results
  }

  async requestPullRequestPermission<T extends IPullRequest> (pullRequest: T, user: Express.User, type: 'read' | 'write' | 'review') {
    const dataset = await new DatasetRepository().getDatasetById(pullRequest.dataset)
    if (type === 'read') {
      // Anyone with contributor/reader permission can access the PR (as well as make comments).
      await new DatasetPermissionRepository().requestDatasetPermission(dataset, {
        role: 'contributor',
        user: user
      })
    } else if (type === 'write') {
      // Initiator or maintainers/owners can make modifications on the PR if necessary.
      if (!pullRequest.user._id.equals(user._id)) {
        await new DatasetPermissionRepository().requestDatasetPermission(dataset, {
          role: 'maintainer',
          user: user
        })
      } else {
        await new DatasetPermissionRepository().requestDatasetPermission(dataset, {
          role: 'contributor',
          user: user
        })
      }
    } else if (type === 'review') {
      // Only maintainers/owners can approve PRs.
      await new DatasetPermissionRepository().requestDatasetPermission(dataset, {
        role: 'maintainer',
        user: user
      })
    }
  }

  async deletePullRequest (pullRequest: HydratedDocument<IPullRequest>) {
    const keys = (await PullRequestAsset.find({
      pullRequest: pullRequest._id
    }, {
      _id: 1,
    })).map(item => {
      return {
        Key: item._id.toString()
      }
    })
    await s3.send(new DeleteObjectsCommand({
      Bucket: process.env.BUCKET_NAME,
      Delete: {
        Objects: keys,
      }
    }))
    await PullRequestAsset.deleteMany({
      pullRequest: pullRequest._id,
    })
    await PullRequestDeleteAsset.deleteMany({
      pullRequest: pullRequest._id,
    })
    await PullRequestAnnotation.deleteMany({
      pullRequest: pullRequest._id,
    })
    await PullRequestMessage.deleteMany({
      pullRequest: pullRequest._id,
    })
  }

  // Core merge algorithm for collaboration feature.
  async mergePullRequest (pullRequest: HydratedDocument<IPullRequest>) {
    if (pullRequest.status === 'merged') {
      throw new InvalidOperationError('This pull request has already been merged.')
    }

    // Block 1 - clone all pull request assets, along with their annotation data, and merge into the base asset collection.
    {
      const prAssets = await PullRequestAsset.find({
        pullRequest: pullRequest._id,
      }).populate<{ annotationData: IPullRequestAnnotation[] }>('annotationData')

      async function clone (sourceId: ObjectId, destinationId: ObjectId) {
        await s3.send(new CopyObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          CopySource: `${process.env.BUCKET_NAME}/${sourceId.toString()}`,
          Key: destinationId.toString(),
        }))
      }

      const newAnnotationEntities: HydratedDocument<IAnnotation>[] = []
      const transformedAssetEntities = prAssets.map(async item => {
        const destinationId = new ObjectId()
        await clone(item._id, destinationId)
        for (let annotationEntity of item.annotationData ?? []) {
          if (!annotationEntity.newAnnotation) throw new Error('This error should never be thrown - annotation data is missing.')
          newAnnotationEntities.push(new Annotation({
            asset: destinationId,
            label: annotationEntity.newAnnotation.label,
            data: annotationEntity.newAnnotation.data,
            frame: annotationEntity.newAnnotation.frame,
          }))
        }
        return new Asset({
          stage: 'uploaded',
          _id: destinationId,
          dataset: pullRequest.dataset._id,
          size: item.size,
          type: item.type,
          displayName: item.displayName,
          uploadedAt: item.uploadedAt,
          mimetype: item.mimetype,
        })
      })

      await Asset.bulkSave(await Promise.all(transformedAssetEntities))
      await Annotation.bulkSave(newAnnotationEntities)
    }

    // Block 2 - merge new annotation into existing assets.
    {
      const pullRequestNewAnnotationsOnExistingAsset = await PullRequestAnnotation.find({
        pullRequest: pullRequest._id,
        targetedAsset: {
          $ne: undefined,
        }
      })
      const transformedAnnotations = []
      for await (let item of pullRequestNewAnnotationsOnExistingAsset) {
        // Asset deleted by previous requests? Do nothing.
        if (!item.targetedAsset) {
          console.error('Missing targeted asset - breaking. This error should never be thrown.')
          continue
        }
        // Throws an error because this is not supposed to happen.
        if (!item.newAnnotation) {
          throw new Error('Missing annotation object - breaking. This error should never be thrown.')
        }
        transformedAnnotations.push(new Annotation({
          asset: item.targetedAsset,
          data: item.newAnnotation.data,
          frame: item.newAnnotation.frame,
          label: item.newAnnotation.label
        }))
      }
      await Annotation.bulkSave(transformedAnnotations)
    }

    // Block 3 - merge edits and deletes of existing annotation.
    {
      const bulkWriteOperations: mongodb.AnyBulkWriteOperation<IAnnotation>[] = []
      const bulkWriteOperations2: mongodb.AnyBulkWriteOperation<IPullRequestAnnotation>[] = []
      const pullRequestExistingAnnotations = await PullRequestAnnotation.find({
        pullRequest: pullRequest._id,
        targetedAnnotation: {
          $ne: undefined,
        }
      }).populate<{ targetedAnnotation: IAnnotation }>('targetedAnnotation')
      for await (let item of pullRequestExistingAnnotations) {
        // Annotation not found? Do nothing.
        if (!item.targetedAnnotation) {
          console.error('Missing targeted annotation - breaking. This error should never be thrown.')
          continue
        }
        if (item.newAnnotation) {
          // Overwrite annotation if data is found.
          bulkWriteOperations.push({
            updateOne: {
              filter: {
                _id: item.targetedAnnotation
              },
              update: {
                $set: {
                  data: item.newAnnotation.data,
                  frame: item.newAnnotation.frame,
                  label: item.newAnnotation.label,
                }
              }
            }
          })
        } else {
          // Delete annotation if data is not found (undefined).
          bulkWriteOperations.push({
            deleteOne: {
              filter: {
                _id: item.targetedAnnotation
              },
            }
          })
        }
        // Push the old annotation into the annotation object.
        bulkWriteOperations2.push({
          updateOne: {
            filter: {
              _id: item.targetedAnnotation._id
            },
            update: {
              $set: {
                oldAnnotation: {
                  data: item.targetedAnnotation.data,
                  frame: item.targetedAnnotation.frame,
                  label: item.targetedAnnotation.label,
                }
              }
            }
          }
        })
      }
      await PullRequestAnnotation.bulkWrite(bulkWriteOperations2)
      await Annotation.bulkWrite(bulkWriteOperations)
    }

    // Block 4 - delete existing assets.
    {
      const deletedAssetRequests = await PullRequestDeleteAsset.find({
        pullRequest: pullRequest._id,
      })

      await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.BUCKET_NAME,
        Delete: {
          Objects: deletedAssetRequests.map(item => ({
            Key: item.targetedAsset.toString(),
          })),
        }
      }))

      const assetBulkWriteOperations: mongodb.AnyBulkWriteOperation<IAsset>[] = []
      const annotationBulkWriteOperations: mongodb.AnyBulkWriteOperation<IAnnotation>[] = []

      for await (let deletedAsset of deletedAssetRequests) {
        assetBulkWriteOperations.push({
          deleteOne: {
            filter: {
              _id: deletedAsset.targetedAsset
            }
          }
        })
        annotationBulkWriteOperations.push({
          deleteMany: {
            filter: {
              asset: deletedAsset.targetedAsset
            }
          }
        })
      }

      await Asset.bulkWrite(assetBulkWriteOperations)
      await Annotation.bulkWrite(annotationBulkWriteOperations)
    }

    pullRequest.status = 'merged'
    await pullRequest.save()
  }

  async changePullRequestStatus (pullRequest: HydratedDocument<IPullRequest>, status: PullRequestStatus) {
    if (pullRequest.status === 'merged') {
      throw new InvalidOperationError('This pull request has already been merged and cannot be modified.')
    }
    pullRequest.status = status
    await pullRequest.save()
  }

  async getPullRequestStats<T extends IPullRequest> (pullRequests: T[]) {
    return PullRequest.aggregate<{
      _id: ObjectId;
      messages: number;
      changedAssets: number;
      deletedAssets: number;
      newAssets: number;
    }>(createPullRequestStatsPipeline(pullRequests.map(item => item._id)))
  }
}
