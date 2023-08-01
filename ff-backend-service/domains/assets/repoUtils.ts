import mongoose from 'mongoose'
import { ObjectId } from '@/utils/abbreviations'
import Annotation from '@/domains/annotations/model'
import { transformImage } from '@/domains/assets/utils'
import * as bucketService from '@/services/bucketService'

export function createAssetCountPipelineOfDatasets (ids: ObjectId[]) {
  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: {
        dataset: {
          $in: ids,
        }
      }
    },
    {
      $facet: {
        byStage: [
          {
            $group: {
              _id: {
                dataset: '$dataset',
                stage: '$stage',
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
              stage: '$_id.stage',
              count: '$count',
            }
          },
        ],
        total: [
          {
            $group: {
              _id: {
                dataset: '$dataset',
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
        byAnnotationStatus: [
          {
            $lookup: {
              from: Annotation.collection.collectionName,
              localField: '_id',
              foreignField: 'asset',
              as: 'annotationCount',
              pipeline: [{
                $group: {
                  _id: '$asset',
                  count: {
                    $count: {},
                  }
                }
              }]
            }
          },
          {
            $project: {
              dataset: 1,
              annotationCount: {
                $first: '$annotationCount.count',
              }
            }
          },
          {
            $match: {
              annotationCount: {
                $gt: 0,
              }
            }
          },
          {
            $group: {
              _id: '$dataset',
              count: {
                $count: {},
              }
            }
          },
          {
            $project: {
              _id: 0,
              dataset: '$_id',
              annotatedCount: '$count',
            }
          }
        ],
        byMimetype: [
          {
            $match: {
              mimetype: {
                $ne: null,
              }
            },
          },
          {
            $group: {
              _id: {
                dataset: '$dataset',
                mimetype: '$mimetype',
              },
              count: {
                $count: {},
              }
            }
          },
          {
            $project: {
              dataset: "$_id.dataset",
              mimetype: "$_id.mimetype",
              count: "$count",
            },
          },
          {
            $group: {
              _id: "$dataset",
              "counts": {
                $push: {
                  k: "$mimetype",
                  v: "$count",
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              dataset: "$_id",
              counts: {
                $arrayToObject: "$counts"
              }
            }
          }
        ],
      }
    }
  ]
  return pipeline
}

export function createAssetSizePipelineOfDatasets (ids: ObjectId[]) {
  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: {
        dataset: {
          $in: ids,
        }
      }
    },
    {
      $facet: {
        byStage: [
          {
            $group: {
              _id: {
                dataset: '$dataset',
                stage: '$stage',
              },
              size: {
                $sum: '$size'
              }
            }
          },
          {
            $project: {
              _id: 0,
              dataset: '$_id.dataset',
              stage: '$_id.stage',
              cloudSize: '$size'
            }
          },
        ],
        total: [
          {
            $group: {
              _id: {
                dataset: '$dataset',
              },
              size: {
                $sum: '$size'
              }
            }
          },
          {
            $project: {
              _id: 0,
              dataset: '$_id.dataset',
              cloudSize: '$size'
            }
          },
        ]
      }
    }
  ]
  return pipeline
}

export async function uploadImage (idKey: ObjectId, image: Express.Multer.File) {
  const imageBuffer = image.buffer
  const transformedBuffer = await transformImage(imageBuffer)
  await bucketService.upload(process.env.BUCKET_NAME, transformedBuffer, {
    fileName: idKey.toString(),
    contentType: 'image/jpeg',
  })
  return idKey
}