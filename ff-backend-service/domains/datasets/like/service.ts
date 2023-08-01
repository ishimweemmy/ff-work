import AbstractService from '@/utils/artifacts/AbstractService';
import { ObjectId } from '@/utils/abbreviations';
import DatasetLikeRepository from './repository';
import DatasetPermissionRepository from '../permissions/repository';
import DatasetRepository from '../repository';

export default class DatasetLikeService extends AbstractService {
  repo = new DatasetLikeRepository();
  datasetRepo = new DatasetRepository();
  permissionsRepo = new DatasetPermissionRepository();

  async getCount(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.getLikeCountOfDataset(dataset);
  }

  async checkIfDatasetLiked(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.checkIfDatasetLiked(dataset, this.user);
  }

  async likeDataset(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.likeDataset(dataset, this.user);
  }

  async unlikeDataset(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.unlikeDataset(dataset, this.user);
  }
}
