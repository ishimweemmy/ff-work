import AbstractService from '../../utils/artifacts/AbstractService'
import AssetRepository from './repository'
import { ObjectId } from '@/utils/abbreviations'
import DatasetRepository from '@/domains/datasets/repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'

export default class ImageService extends AbstractService {
  repo = new AssetRepository()
  datasetRepo = new DatasetRepository()
  datasetPermissionRepo = new DatasetPermissionRepository()

  async getAssetById (id: ObjectId) {
    const asset = await this.repo.getAssetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(asset.dataset, {
      user: this.user,
      role: 'contributor',
    })
    const url = await this.repo.getS3UrlOfAsset(asset);
    return {
      ...asset.toObject(),
      url: url,
    }
  }

  async getS3UrlByAssetId (id: ObjectId) {
    const asset = await this.repo.getAssetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(asset.dataset, {
      user: this.user,
      role: 'contributor',
    })
    return await this.repo.getS3UrlOfAsset(asset)
  }

  async deleteAsset (id: ObjectId) {
    const asset = await this.repo.getAssetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(asset.dataset, {
      user: this.user,
      role: 'admin',
    })
    await this.repo.deleteAsset(asset)
    await this.datasetRepo.updateDataset(asset.dataset);
    return asset
  }

  async getAssetWithUrl (id: ObjectId) {
    const asset = await this.repo.getAssetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(asset.dataset, {
      user: this.user,
      role: 'contributor',
    })
    return {
      ...asset.toJSON(),
      url: await this.getS3UrlByAssetId(asset.id),
    }
  }

  async getAssetsByDatasetId (datasetId: ObjectId, query: {
    stage?: string,
    displayName?: string,
    pagination?: Express.RequestPagination,
  }) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'contributor',
    })
    return await this.repo.getLeanAssetsByDataset(dataset, query)
  }

  async countAssetsByDatasetId (datasetId: ObjectId, type?: string) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    })
    return await this.repo.countAssetsByDataset(dataset, type)
  }

  async addImageToDataset (datasetId: ObjectId, file: Express.Multer.File) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    const result = await this.repo.addImageToDataset(dataset, file)
    await this.datasetRepo.updateDataset(dataset);
    return result;
  }

  async addTextAssetToDataset (datasetId: ObjectId, file: Express.Multer.File) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    const result = await this.repo.addTextAssetToDataset(dataset, file)
    await this.datasetRepo.updateDataset(dataset);
    return result;
  }

  async addMiscAssetToDataset (datasetId: ObjectId, file: Express.Multer.File) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    const result = await this.repo.addMiscellaneousAssetToDataset(dataset, file)
    await this.datasetRepo.updateDataset(dataset);
    return result;
  }

  async getAssetIdsByDatasetId (datasetId: ObjectId, params: { stage?: Flockfysh.AssetStage }) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'contributor',
    })
    return await this.repo.getAssetIdsByDataset(dataset, { stage: params.stage })
  }
}
