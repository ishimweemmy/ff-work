import AbstractService from '../../utils/artifacts/AbstractService'
import AssetService from '../assets/service'
import AnnotationRepo, { EditAnnotationParams } from './repository'
import { IAnnotation } from '@/domains/annotations/model'
import { ObjectId } from '@/utils/abbreviations'
import AssetRepository from '@/domains/assets/repository'
import DatasetRepository from '@/domains/datasets/repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import dataset from '@/routes/microservices/dataset'

export default class AnnotationService extends AbstractService {
  repo = new AnnotationRepo()
  assetRepo = new AssetRepository()
  datasetRepo = new DatasetRepository()
  datasetPermissionRepo = new DatasetPermissionRepository()

  async getAnnotationById (annotationBoxId: ObjectId) {
    const annotation = await this.repo.getAnnotationById(annotationBoxId)
    await this.datasetPermissionRepo.requestDatasetPermission(annotation.asset.dataset, {
      user: this.user,
      role: 'contributor'
    })
    return annotation
  }

  async getAnnotationsByAssetId (imageId: ObjectId) {
    const asset = await this.assetRepo.getAssetById(imageId)
    await this.datasetPermissionRepo.requestDatasetPermission(asset.dataset, {
      user: this.user,
      role: 'contributor'
    })
    return this.repo.getAnnotationsByAsset(asset)
  }

  async clearAnnotationsByAssetId (assetId: ObjectId) {
    const asset = await this.assetRepo.getAssetById(assetId)
    await this.datasetPermissionRepo.requestDatasetPermission(asset.dataset, {
      user: this.user,
      role: 'admin'
    })
    const result = this.repo.deleteAnnotationsByAsset(asset)
    await this.datasetRepo.updateDataset(asset.dataset);
    return result
  }

  async addAnnotation (imageId: ObjectId, annotationData: Partial<IAnnotation>) {
    if (!annotationData.label) {
      throw new Error('Missing label.')
    }
    const asset = await new AssetRepository().getAssetById(imageId)
    await this.datasetPermissionRepo.requestDatasetPermission(asset.dataset, {
      user: this.user,
      role: 'admin'
    })
    const result = await this.repo.createAnnotation(asset, annotationData)
    await this.datasetRepo.updateDataset(asset.dataset);
    return result
  }

  async editAnnotation (annotationId: ObjectId, editAnnotationParams: EditAnnotationParams) {
    const annotationBox = await this.getAnnotationById(annotationId)
    await this.datasetPermissionRepo.requestDatasetPermission(annotationBox.asset.dataset, {
      user: this.user,
      role: 'admin'
    })
    const populatedDataset = annotationBox.asset.dataset;
    await this.repo.depopulateAndEditAnnotation(annotationBox, editAnnotationParams);
    await this.datasetRepo.updateDataset(populatedDataset);
  }

  async removeAnnotation (annotationId: ObjectId) {
    const annotationBox = await this.getAnnotationById(annotationId)
    await this.datasetPermissionRepo.requestDatasetPermission(annotationBox.asset.dataset, {
      user: this.user,
      role: 'admin'
    })
    await this.repo.deleteAnnotation(annotationBox)
    await this.datasetRepo.updateDataset(annotationBox.asset.dataset)
  }
}
