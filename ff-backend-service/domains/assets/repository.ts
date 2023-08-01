import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import Asset, { IAsset } from './model'
import * as BucketService from '@/services/bucketService'
import mongoose, { HydratedDocument } from 'mongoose'
import { InvalidOperationError, NotFoundError, UserMismatchError } from '@/utils/errors'
import AnnotationRepository from '@/domains/annotations/repository'
import { ObjectId } from '@/utils/abbreviations'
import { IDataset } from '@/domains/datasets/model'
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as config from '@/utils/config'
import { createAssetCountPipelineOfDatasets, createAssetSizePipelineOfDatasets, uploadImage } from './repoUtils'
import * as bucketService from '@/services/bucketService'
import { ASSET_STAGE_ENUM } from '@/domains/assets/enums'
import * as console from 'console'

export type PopulatedAsset = Awaited<ReturnType<AssetRepository['getAssetById']>>
const s3 = new S3Client(config.S3_CONFIG)

export default class AssetRepository extends AbstractRepository {
  async getAssetById (id: ObjectId) {
    const asset = await Asset.findById(id).populate<{ dataset: IDataset }>('dataset')
    if (!asset) throw new NotFoundError('Asset not found.')
    return asset
  }

  async deleteAsset (asset: PopulatedAsset) {
    await new AnnotationRepository().deleteAnnotationsByAsset(asset)
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: asset._id.toString(),
    }
    const command = new DeleteObjectCommand(params)
    await s3.send(command)
    await asset.remove()
  }

  async getS3UrlOfAsset<T extends IAsset> (asset: PopulatedAsset | HydratedDocument<IAsset> | T) {
    const getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: asset._id.toString(),
    }
    const command = new GetObjectCommand(getObjectParams)
    return await getSignedUrl(s3, command, { expiresIn: 86400 })
  }

  verifyAssetOwner (asset: PopulatedAsset, user: Express.User) {
    if (!asset.dataset.user.equals(user._id)) {
      throw new UserMismatchError('You do not own this asset.')
    }
  }

  async deleteAssetsByDataset (dataset: HydratedDocument<IDataset>) {
    await new AnnotationRepository().deleteAnnotationsByDataset(dataset)
    const imageIds = (await Asset.find({
      dataset: new mongoose.Types.ObjectId(dataset._id),
    }, {
      _id: 1,
    })).map(object => {
      return object._id.toString()
    })
    await Asset.deleteMany({ dataset: new mongoose.Types.ObjectId(dataset._id) })
    await BucketService.deleteMany(process.env.BUCKET_NAME, imageIds)
  }

  async getLeanAssetsByDataset (dataset: HydratedDocument<IDataset>, query: {
    stage?: string;
    displayName?: string;
    pagination?: Express.RequestPagination
  }) {
    let limit = query.pagination?.limit ?? 50
    const internalQuery: {
      dataset: ObjectId;
      stage?: string;
      displayName?: {
        $regex: string,
      };
    } = {
      dataset: dataset._id,
    }
    if (query.stage) {
      internalQuery.stage = query.stage
    }
    if (query.displayName) {
      internalQuery.displayName = { $regex: query.displayName }
    }
    const page = await Asset.paginate({
      query: internalQuery,
      limit: limit,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    const { results: imageEntities, ...meta } = page
    const promises = imageEntities.map(async (image) => {
      return {
        ...image,
        url: await this.getS3UrlOfAsset(image),
      }
    })
    return {
      data: await Promise.all(promises),
      meta: meta
    }
  }

  async countAssetsByDataset (dataset: HydratedDocument<IDataset>, type?: string) {
    const query: { dataset: mongoose.Types.ObjectId; stage?: string } = {
      dataset: dataset._id,
    }
    if (type === 'all') return Asset.find(query).count()
    if (type) query.stage = type
    return Asset.find(query).count()
  }

  async aggregateAssetCountsByDataset (dataset: HydratedDocument<IDataset>) {
    return (await this.aggregateAssetCountsByDatasets([dataset]))[0]
  }

  async aggregateTotalSizesByDataset (dataset: HydratedDocument<IDataset>) {
    return (await this.aggregateTotalSizesByDatasets([dataset]))[0]
  }

  async aggregateTotalSizesByDatasets<T extends IDataset> (datasets: T[]) {
    const ids = datasets.map(item => item._id)
    const pipeline = createAssetSizePipelineOfDatasets(ids)
    const rawOutput: {
      byStage: {
        dataset: ObjectId;
        stage: Flockfysh.AssetStage,
        cloudSize: number,
      }[],
      total: {
        dataset: ObjectId;
        cloudSize: number,
      }[],
    } = (await Asset.aggregate(pipeline))[0]
    type IntermediateObj = {
      byStage: Record<Flockfysh.AssetStage, number>,
      totalCloudSize: number,
      clusterSize: number,
    };
    const intermediate: Record<string, IntermediateObj> = {}
    for (let item of rawOutput.byStage) {
      intermediate[item.dataset.toString()] ??= {} as IntermediateObj
      intermediate[item.dataset.toString()].byStage ??= {} as Record<Flockfysh.AssetStage, number>
      intermediate[item.dataset.toString()].byStage[item.stage] = item.cloudSize
    }
    for (let item of rawOutput.total) {
      intermediate[item.dataset.toString()] ??= {} as IntermediateObj
      intermediate[item.dataset.toString()].totalCloudSize = item.cloudSize
    }
    for (let dataset of datasets) {
      intermediate[dataset._id.toString()] ??= {} as IntermediateObj
      intermediate[dataset._id.toString()].byStage ??= {} as Record<Flockfysh.AssetStage, number>
      for (let stage of ASSET_STAGE_ENUM._def.values) {
        intermediate[dataset._id.toString()].byStage[stage] ??= 0
      }
      intermediate[dataset._id.toString()].totalCloudSize ??= 0
      intermediate[dataset._id.toString()].clusterSize = dataset.sizeOnCluster
    }
    const output: {
      dataset: ObjectId;
      byStage: Record<Flockfysh.AssetStage, number>;
      total: {
        cloud: number,
        cluster: number,
        total: number,
      },
    }[] = []
    for (let [id, value] of Object.entries(intermediate)) {
      output.push({
        dataset: new ObjectId(id),
        byStage: value.byStage,
        total: {
          cloud: value.totalCloudSize,
          cluster: value.clusterSize,
          total: value.totalCloudSize + value.clusterSize,
        }
      })
    }
    return output
  }

  async aggregateAssetCountsByDatasets<T extends IDataset> (datasets: T[]) {
    const ids = datasets.map(item => item._id)
    const pipeline = createAssetCountPipelineOfDatasets(ids)
    const rawOutput: {
      byStage: {
        dataset: ObjectId;
        stage: Flockfysh.AssetStage,
        count: number,
      }[],
      total: {
        dataset: ObjectId;
        count: number,
      }[],
      byAnnotationStatus: {
        dataset: ObjectId;
        annotatedCount: number;
      }[],
      byMimetype: {
        dataset: ObjectId;
        counts: Record<string, number>
      }[],
    } = (await Asset.aggregate(pipeline))[0]

    type IntermediateObj = {
      byStage: Record<Flockfysh.AssetStage, number>,
      total: number,
      annotated: number,
      byMimetype: Record<string, number>
    };

    const intermediate: Record<string, IntermediateObj> = {}
    for (let item of rawOutput.byStage) {
      intermediate[item.dataset.toString()] ??= {} as IntermediateObj
      intermediate[item.dataset.toString()].byStage ??= {} as Record<Flockfysh.AssetStage, number>
      intermediate[item.dataset.toString()].byStage[item.stage] = item.count
    }
    for (let item of rawOutput.byAnnotationStatus) {
      intermediate[item.dataset.toString()] ??= {} as IntermediateObj
      intermediate[item.dataset.toString()].annotated = item.annotatedCount
    }
    for (let item of rawOutput.total) {
      intermediate[item.dataset.toString()] ??= {} as IntermediateObj
      intermediate[item.dataset.toString()].total = item.count
    }
    for (let item of rawOutput.byMimetype) {
      intermediate[item.dataset.toString()] ??= {} as IntermediateObj
      intermediate[item.dataset.toString()].byMimetype = item.counts
    }
    for (let id of ids) {
      intermediate[id.toString()] ??= {} as IntermediateObj
      intermediate[id.toString()].byStage ??= {} as Record<Flockfysh.AssetStage, number>
      for (let stage of ASSET_STAGE_ENUM._def.values) {
        intermediate[id.toString()].byStage[stage] ??= 0
      }
      intermediate[id.toString()].total ??= 0
      intermediate[id.toString()].annotated ??= 0
      intermediate[id.toString()].byMimetype ??= {}
    }
    const output: {
      dataset: ObjectId;
      byStage: Record<Flockfysh.AssetStage, number>;
      byAnnotationStatus: {
        annotated: number;
        unannotated: number;
      };
      byMimetype: Record<string, number>;
      total: number,
    }[] = []
    for (let [id, value] of Object.entries(intermediate)) {
      output.push({
        dataset: new ObjectId(id),
        byStage: value.byStage,
        total: value.total,
        byAnnotationStatus: {
          annotated: value.annotated,
          unannotated: value.total - value.annotated,
        },
        byMimetype: value.byMimetype
      })
    }
    return output
  }

  async addImageToDataset (dataset: HydratedDocument<IDataset>, image: Express.Multer.File) {
    const imageKey = new ObjectId()
    const readyImage = new Asset({
      _id: imageKey,
      dataset: dataset._id,
      size: image.size,
      displayName: image.originalname,
      stage: 'uploaded',
      type: 'image',
      mimetype: 'image/jpeg',
    })
    await readyImage.validate()
    await uploadImage(imageKey, image)
    await readyImage.save()
    return readyImage
  }

  async addTextAssetToDataset (dataset: HydratedDocument<IDataset>, asset: Express.Multer.File) {
    const assetBuffer = asset.buffer
    const assetId = new mongoose.Types.ObjectId()
    const readyAsset = new Asset({
      _id: assetId,
      dataset: dataset._id,
      size: asset.size,
      displayName: asset.originalname,
      stage: 'uploaded',
      type: 'text',
      mimetype: asset.mimetype,
    })
    await readyAsset.validate()
    await bucketService.upload(process.env.BUCKET_NAME, assetBuffer, {
      fileName: assetId.toString(),
      contentType: asset.mimetype,
    })
    await readyAsset.save()
    return readyAsset
  }

  async addMiscellaneousAssetToDataset (dataset: HydratedDocument<IDataset>, asset: Express.Multer.File) {
    const assetBuffer = asset.buffer
    const assetId = new mongoose.Types.ObjectId()
    const readyAsset = new Asset({
      _id: assetId,
      dataset: dataset._id,
      size: asset.size,
      displayName: asset.originalname,
      stage: 'uploaded',
      type: 'other',
      mimetype: asset.mimetype,
    })
    await readyAsset.validate()
    await bucketService.upload(process.env.BUCKET_NAME, assetBuffer, {
      fileName: assetId.toString(),
      contentType: asset.mimetype,
    })
    await readyAsset.save()
    return readyAsset
  }

  // Gets asset IDs for frontend pagination in annotation interface.
  // TODO: This is only a temporary measure! Cursor pagination should be used whenever possible for maximal performance.
  async getAssetIdsByDataset (dataset: HydratedDocument<IDataset>, { stage }: { stage?: Flockfysh.AssetStage }) {
    const query: {
      dataset: ObjectId,
      stage?: Flockfysh.AssetStage
    } = { dataset: dataset._id }
    if (stage) {
      query.stage = stage
    }
    return (
      await Asset.find({ dataset: dataset._id, stage: stage }, { id: 1 })
    ).map((item) => item.id)
  }
}
