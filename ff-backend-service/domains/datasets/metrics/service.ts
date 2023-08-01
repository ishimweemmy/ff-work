import AbstractService from '@/utils/artifacts/AbstractService'
import { ObjectId } from '@/utils/abbreviations'
import ActivityRepository from './repository'
import DatasetRepository from '../repository'
import DatasetPermissionRepository from '../permissions/repository'

export default class ActivityService extends AbstractService {
  repo = new ActivityRepository()
  datasetRepo = new DatasetRepository()
  permissionsRepo = new DatasetPermissionRepository()

  async getDatasetViewCount (id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id)
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    })

    return this.repo.getDatasetViews(dataset)
  }

  async getDatasetDownloadCount (id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id)
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    })
    return this.repo.getDatasetDownloads(dataset)
  }

  async getDatasetActivity (id: ObjectId, periodLengthInDays: number = 28) {
    const dataset = await this.datasetRepo.getDatasetById(id)
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    })
    return this.repo.getDatasetActivity(dataset, periodLengthInDays)
  }

  async addViewToDataset (id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id)
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    })
    await this.datasetRepo.incrementViews(dataset)
    return this.repo.addDatasetView(dataset)
  }

  async addDownloadToDataset (id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id)
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    })
    await this.datasetRepo.incrementDownloads(dataset)
    return this.repo.addDatasetDownload(dataset)
  }
}
