import ExposedServices from '@/utils/artifacts/AbstractService'
import Asset, { IAsset } from '@/domains/assets/model'
import Dataset, { IDataset } from '@/domains/datasets/model'
import mongoose, { HydratedDocument } from 'mongoose'
import DatasetRepository from '@/domains/datasets/repository'
import { ObjectId } from '@/utils/abbreviations'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import AssetRepository from '@/domains/assets/repository'
import { MongoCursorPaginationMeta } from 'mongo-cursor-pagination'
import Annotation, { IAnnotation } from '@/domains/annotations/model'

export default class CLI extends ExposedServices {
  datasetRepo = new DatasetRepository()
  assetRepo = new AssetRepository()
  datasetPermissionRepo = new DatasetPermissionRepository()

  async getDatasetAssets (
    datasetId: ObjectId,
    query: {
      stage?: string,
      displayName?: string;
      pagination?: Express.RequestPagination
    }
  ): Promise<{
    meta: MongoCursorPaginationMeta,
    data: (IAsset & {
      annotationData: IAnnotation[]
      url: string
    })[],
  }> {
    throw new Error('Abstract method.')
  }

  async getDatasets (): Promise<
    { _id: mongoose.Types.ObjectId; name: string }[]
  > {
    throw new Error('Abstract method.')
  }

  async getDataset (datasetId: ObjectId): Promise<HydratedDocument<IDataset>> {
    throw new Error('Abstract method.')
  }
}

CLI.prototype.getDatasetAssets = async function getDatasetImages (
  datasetId,
  query
) {
  const dataset = await this.datasetRepo.getDatasetById(datasetId)
  await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
    user: this.user,
    role: 'contributor',
  })

  let limit = query.pagination?.limit ?? 50
  const internalQuery: {
    dataset: ObjectId;
    stage?: string;
    displayName?: string;
  } = {
    dataset: dataset._id,
  }
  if (query.stage) {
    internalQuery.stage = query.stage
  }
  if (query.displayName) {
    internalQuery.displayName = query.displayName
  }
  const page = await Asset.paginate({
    query: internalQuery,
    limit: limit,
    next: query.pagination?.next,
    previous: query.pagination?.previous,
  })
  const { results, ...meta } = page
  const hydratedResults = await Asset.populate(results, {
    path: 'annotationData',
    model: Annotation,
  })
  return {
    meta,
    data: await Promise.all(
      hydratedResults.map(async (item) => {
        const url = await this.assetRepo.getS3UrlOfAsset(item)
        return {
          ...item,
          annotationData: item.annotationData ?? [],
          url,
        }
      })
    ),
  }
}

CLI.prototype.getDatasets = async function getDatasets () {
  return Dataset.find({
    user: this.user._id,
    stage: 'completed',
  }).select({
    name: 1,
  })
}

CLI.prototype.getDataset = async function getDatasetById (id) {
  const dataset = await this.datasetRepo.getDatasetById(id)
  await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
    user: this.user,
    role: 'contributor',
  })
  return dataset
}
