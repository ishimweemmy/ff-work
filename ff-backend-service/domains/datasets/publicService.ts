import { DatasetExposedSearchQuery } from '@/domains/datasets/queries'
import DatasetRepository from '@/domains/datasets/repository'
import AbstractPublicService from '@/utils/artifacts/AbstractPublicService'
import * as console from 'console'

export default class DatasetPublicService extends AbstractPublicService {
  repo = new DatasetRepository();
  async searchPublicDatasets (query: DatasetExposedSearchQuery) {
    let queryResult
    queryResult = await this.repo.searchDatasets({
      ...query,
      public: true,
    });
    const result = await this.repo.expandDatasetObjects(
      queryResult.data,
      {
        expand: query.expand,
      },
    );
    return {
      ...queryResult,
      data: result,
    }
  }
}

