import { ObjectId } from '@/utils/abbreviations'
import mongoose from 'mongoose'
import Asset from '@/domains/assets/model'

export function createAnnotationCountPipelineOfDatasets (ids: ObjectId[]) {
  const pipeline: mongoose.PipelineStage[] = [
    {
      $lookup: {
        from: Asset.collection.collectionName,
        localField: 'asset',
        foreignField: '_id',
        as: 'asset',
      },
    },
    {
      $match: {
        "asset.dataset": {
          $in: ids,
        }
      }
    },
    {
      $facet: {
        total: [
          {
            $group: {
              _id: {
                dataset: '$asset.dataset',
              },
              count: {
                $count: {},
              }
            }
          },
          {
            $project: {
              _id: 0,
              dataset: '$_id.dataset',
              count: '$count',
            }
          },
        ],
      }
    }
  ]
  return pipeline
}