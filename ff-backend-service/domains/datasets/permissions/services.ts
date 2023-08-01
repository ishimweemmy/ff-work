import AbstractService from '@/utils/artifacts/AbstractService'
import DatasetRepository from '@/domains/datasets/repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import { ObjectId } from '@/utils/abbreviations'
import { DatasetRole } from '@/domains/datasets/permissions/model'
import UserRepository from '@/domains/users/repository'
import mongoose from 'mongoose'

export default class DatasetPermissionService extends AbstractService {
  userRepo = new UserRepository()
  datasetRepo = new DatasetRepository()
  repo = new DatasetPermissionRepository()

  async getPaginatedDatasetPermissionsByDatasetId (datasetId: ObjectId, query: {
    expand: string[],
    pagination?: {
      greaterThan?: ObjectId,
      lessThan?: ObjectId,
      limit?: number,
    }
  }) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.repo.requestDatasetPermission(dataset, {
      role: 'admin',
      user: this.user,
    })
    const page = await this.repo.getPaginatedPermissionsByDataset(dataset, query)
    return {
      ...page,
      data: await this.repo.expandPermissionObject(page.data, query.expand),
    }
  }

  async searchPaginatedDatasetPermissionsByDatasetId (datasetId: ObjectId, query: {
    name?: string,
    email?: string,
    pagination?: {
      greaterThan?: ObjectId,
      lessThan?: ObjectId,
      limit?: number,
    }
  }) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.repo.requestDatasetPermission(dataset, {
      role: 'admin',
      user: this.user,
    })
    return await this.repo.searchPaginatedPermissionsByDataset(dataset, query)
  }

  async assignDatasetPermissionToUserEmail (datasetId: ObjectId, params: {
    role: DatasetRole,
    email: string
  }, extras: {
    expand: string[],
  }) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.repo.requestDatasetPermission(dataset, {
      role: 'admin',
      user: this.user,
    })
    const user = await this.userRepo.findUserByEmail(params.email)
    const permission = await this.repo.assignPermission(dataset, user, params.role);
    return (await this.repo.expandPermissionObject([permission], extras.expand))[0]
  }

  async assignDatasetPermissionToUsername (datasetId: ObjectId, params: {
    role: DatasetRole,
    username: string
  }, extras: {
    expand: string[],
  }) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.repo.requestDatasetPermission(dataset, {
      role: 'admin',
      user: this.user,
    })
    const user = await this.userRepo.findUserByUsername(params.username)
    const permission = await this.repo.assignPermission(dataset, user, params.role);
    return (await this.repo.expandPermissionObject([permission], extras.expand))[0]
  }

  async getDatasetPermissionById (id: ObjectId) {
    const permission = await this.repo.getDatasetPermissionById(id)
    await this.repo.requestDatasetPermission(permission.dataset, {
      role: 'admin',
      user: this.user,
    })
    return permission
  }

  async editDatasetPermissionById (id: ObjectId, newRole: DatasetRole) {
    const permission = await this.repo.getDatasetPermissionById(id)
    await this.repo.requestDatasetPermission(permission.dataset, {
      role: 'admin',
      user: this.user,
    })
    await this.repo.editPermission(permission, newRole)
  }

  async revokeDatasetPermissionById (id: ObjectId) {
    const permission = await this.repo.getDatasetPermissionById(id)
    await this.repo.requestDatasetPermission(permission.dataset, {
      role: 'admin',
      user: this.user,
    })
    await this.repo.revokePermission(permission)
  }

  async searchSharedDatasets (query: {
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
    let queryResult = await this.repo.getSharedDatasets({
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
