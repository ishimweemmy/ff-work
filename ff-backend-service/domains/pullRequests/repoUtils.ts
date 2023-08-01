import mongoose from 'mongoose'
import { ObjectId } from '@/utils/abbreviations'
import PullRequestMessage from '@/domains/pullRequests/messages/model'
import PullRequestAsset from '@/domains/pullRequests/items/assets/assetModel'
import PullRequestDeleteAsset from '@/domains/pullRequests/items/assets/deleteAssetModel'
import PullRequestAnnotation from '@/domains/pullRequests/items/annotations/model'

export function createPullRequestStatsPipeline (pullRequestIds: ObjectId[]) {
  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: {
        _id: {
          $in: pullRequestIds,
        },
      },
    },
    {
      $project: {
        _id: 1,
      }
    },
    {
      $lookup: {
        from: PullRequestAsset.collection.collectionName,
        localField: '_id',
        foreignField: 'pullRequest',
        as: 'newAssets',
        pipeline: [
          {
            $group: {
              _id: null,
              count: {
                $count: {},
              }
            }
          },
        ]
      }
    },
    {
      $set: {
        newAssets: {
          $ifNull: [{
            $first: '$newAssets.count'
          }, 0]
        }
      }
    },
    {
      $lookup: {
        from: PullRequestMessage.collection.collectionName,
        localField: '_id',
        foreignField: 'pullRequest',
        as: 'messages',
        pipeline: [
          {
            $group: {
              _id: null,
              count: {
                $count: {},
              }
            }
          },
        ]
      }
    },
    {
      $set: {
        messages: {
          $ifNull: [{
            $first: '$messages.count'
          }, 0]
        }
      }
    },
    {
      $lookup: {
        from: PullRequestDeleteAsset.collection.collectionName,
        localField: '_id',
        foreignField: 'pullRequest',
        as: 'deletedAssets',
        pipeline: [
          {
            $group: {
              _id: null,
              count: {
                $count: {},
              }
            }
          },
        ]
      }
    },
    {
      $set: {
        deletedAssets: {
          $ifNull: [{
            $first: '$deletedAssets.count'
          }, 0]
        }
      }
    },
    {
      $lookup: {
        from: PullRequestAnnotation.collection.collectionName,
        localField: '_id',
        foreignField: 'pullRequest',
        as: 'changedAssets',
        pipeline: [
          {
            $lookup: {
              from: 'annotations',
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
            $group: {
              _id: '$_id',
              count: {
                $count: {},
              }
            }
          },
        ]
      }
    },
    {
      $set: {
        changedAssets: {
          $ifNull: [{
            $first: '$changedAssets.count'
          }, 0]
        }
      }
    },
  ];

  return pipeline;
}
