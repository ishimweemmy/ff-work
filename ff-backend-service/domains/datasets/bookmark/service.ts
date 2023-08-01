import mongoose from 'mongoose';
import AbstractService from '@/utils/artifacts/AbstractService';
import { ObjectId } from '@/utils/abbreviations';
import DatasetBookmarkRepository from './repository';
import DatasetPermissionRepository from '../permissions/repository';
import DatasetRepository from '../repository';

export default class DatasetBookmarkService extends AbstractService {
  repo = new DatasetBookmarkRepository();
  datasetRepo = new DatasetRepository();
  permissionsRepo = new DatasetPermissionRepository();

  async getCount(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.getBookmarkCountOfDataset(dataset);
  }

  async checkIfDatasetBookmarked(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.checkIfDatasetBookmarked(dataset, this.user);
  }

  async bookmarkDataset(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.bookmarkDataset(dataset, this.user);
  }

  async unbookmarkDataset(id: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(id);
    await this.permissionsRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    });
    return this.repo.unbookmarkDataset(dataset, this.user);
  }

  async searchBookmarkedDatasets (query: {
    paid?: boolean;
    public?: boolean;
    recipe?: ObjectId;
    name?: string;
    sort?: Express.RequestSort;
    expand: string[];
    pagination?: {
      greaterThan?: mongoose.Types.ObjectId;
      lessThan?: mongoose.Types.ObjectId;
      limit?: number;
    };
  }) {
    let queryResult = await this.repo.getBookmarkedDatasets({
      ...query,
      user: this.user._id,
    })
    const result = await this.datasetRepo.expandDatasetObjects(
      queryResult.data,
      {
        expand: query.expand,
        user: this.user
      },
    )
    return {
      ...queryResult,
      data: result,
    }
  }

}
