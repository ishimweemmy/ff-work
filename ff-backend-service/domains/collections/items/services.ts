import AbstractService from '@/utils/artifacts/AbstractService'
import CollectionItemRepository from '@/domains/collections/items/repository'
import { ObjectId } from '@/utils/abbreviations'
import CollectionRepository from '@/domains/collections/repository'
import DatasetRepository from '@/domains/datasets/repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'

export default class CollectionItemService extends AbstractService {
  repo = new CollectionItemRepository();
  collectionRepo = new CollectionRepository();
  datasetRepo = new DatasetRepository();
  datasetPermissionRepo = new DatasetPermissionRepository();

  async addDataset(collectionId: ObjectId, datasetId: ObjectId) {
    const collection = await this.collectionRepo.getCollectionById(collectionId);
    await this.collectionRepo.verifyCollectionOwner(collection, this.user);
    const dataset = await this.datasetRepo.getDatasetById(datasetId);
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'contributor',
    });
    return await this.repo.addDataset(collection, dataset);
  }

  async deleteDataset(collectionId: ObjectId, datasetId: ObjectId) {
    const collection = await this.collectionRepo.getCollectionById(collectionId);
    await this.collectionRepo.verifyCollectionOwner(collection, this.user);
    const dataset = await this.datasetRepo.getDatasetById(datasetId);
    return await this.repo.deleteDataset(collection, dataset);
  }

  async searchDatasets(collectionId: ObjectId, query: {
    paid?: boolean;
    public?: boolean;
    user?: ObjectId;
    recipe?: ObjectId;
    name?: string;
    sort?: Express.RequestSort;
    expand: string[],
    pagination?: Express.RequestPagination;
  }) {
    const collection = await this.collectionRepo.getCollectionById(collectionId);
    await this.collectionRepo.requestCollectionPermission(collection, this.user);
    const result = await this.repo.searchDatasets(collection, query);
    return {
      meta: result.meta,
      data: await this.datasetRepo.expandDatasetObjects(result.data, {
        expand: query.expand,
        user: this.user,
      })
    }
  }
}
