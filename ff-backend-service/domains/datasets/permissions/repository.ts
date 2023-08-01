import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import mongoose, { HydratedDocument } from 'mongoose'
import Dataset, { IDataset } from '@/domains/datasets/model'
import DatasetPermission, {
  DATASET_ROLE_HIERARCHY,
  DatasetRole,
  IDatasetPermission
} from '@/domains/datasets/permissions/model'
import User, { IUser } from '@/domains/users/models/UserModel'
import { ObjectId } from '@/utils/abbreviations'
import { NotFoundError, PermissionError, UnauthorizedError } from '@/utils/errors'
import DatasetRepository from '@/domains/datasets/repository'
import { aggregate } from 'mongo-cursor-pagination'
import RedactedUser, { IRedactedUser } from '@/domains/users/models/RedactedUserModel'

export type DatasetPermissionWithUserAndDataset = Awaited<ReturnType<DatasetPermissionRepository['getDatasetPermissionById']>>
export type DatasetPermissionWithUser = Awaited<ReturnType<DatasetPermissionRepository['getPermissionsByDataset']>>['0']

export default class DatasetPermissionRepository extends AbstractRepository {
  async getPermissionsByDataset (dataset: HydratedDocument<IDataset>) {
    return DatasetPermission.find({
      dataset: dataset._id
    }).sort({
      _id: -1,
    }).populate<{ user: IUser }>('user')
  }

  async getPaginatedPermissionsByDataset (dataset: HydratedDocument<IDataset>, query: {
    pagination?: Express.RequestPagination
  }) {
    const limit = query.pagination?.limit ?? 50
    const internalQuery: {
      dataset: ObjectId,
    } = {
      dataset: dataset._id
    }
    const { results, ...meta } = await DatasetPermission.paginate({
      limit: limit,
      query: internalQuery,
      next: query.pagination?.next,
      previous: query.pagination?.previous,
    })
    return {
      meta: meta,
      data: results,
    }
  }

  async expandPermissionObject<T extends IDatasetPermission> (permissions: T[], expand: string[]) {
    let results: (IDatasetPermission & {
      user: ObjectId | IRedactedUser,
      dataset: ObjectId | IDataset,
    })[] = permissions.map(item => DatasetPermission.hydrate(item).toObject({
      depopulate: true,
    }))
    const expandableKeys: {
      key: keyof IDatasetPermission | string,
      model?: mongoose.Model<any>,
    }[] = [
      {
        key: 'user',
        model: RedactedUser,
      },
      {
        key: 'dataset',
      }
    ]
    for (let keyObject of expandableKeys) {
      if (expand.includes(keyObject.key)) {
        results = await DatasetPermission.populate(results, {
          path: keyObject.key,
          model: keyObject.model,
        })
      }
    }
    return results
  }

  async searchPaginatedPermissionsByDataset (dataset: HydratedDocument<IDataset>, query: {
    name?: string,
    email?: string,
    pagination?: {
      greaterThan?: ObjectId,
      lessThan?: ObjectId,
      limit?: number,
    }
  }) {
    const limit = query.pagination?.limit ?? 50
    const internalQuery: {
      '$or'?: {
        'user.fullName'?: {
          $regex: string
        },
        'user.email'?: {
          $regex: string
        },
      }[],
    } = {}
    const internalQuery2: {
      _id?: {
        $gt?: ObjectId,
        $lt?: ObjectId,
      },
      dataset: ObjectId,
    } = {
      dataset: dataset._id,
    }
    if (query.pagination?.lessThan) {
      internalQuery2._id ??= {}
      internalQuery2._id.$lt = query.pagination.lessThan
    }
    if (query.pagination?.greaterThan) {
      internalQuery2._id ??= {}
      internalQuery2._id.$gt = query.pagination.greaterThan
    }
    if (query.name) {
      internalQuery.$or ??= []
      internalQuery.$or.push({ 'user.fullName': { $regex: query.name } })
    }
    if (query.email) {
      internalQuery.$or ??= []
      internalQuery.$or.push({ 'user.email': { $regex: query.email } })
    }
    return DatasetPermission.aggregate<IDatasetPermission & { user: IUser }>([
      {
        $match: internalQuery2,
      },
      {
        $lookup: {
          from: User.collection.collectionName,
          foreignField: '_id',
          localField: 'user',
          as: 'user',
        }
      },
      {
        $match: internalQuery
      },
      {
        $limit: limit,
      },
      {
        $set: {
          user: {
            $first: '$user'
          }
        }
      },
    ])
  }

  async assignPermission<T extends IUser> (dataset: HydratedDocument<IDataset>, user: T, role: DatasetRole, extraParams?: {
    purchased?: boolean
  }): Promise<HydratedDocument<IDatasetPermission>> {
    return DatasetPermission.findOneAndUpdate({
      dataset: dataset._id,
      user: user._id,
    }, {
      dataset: dataset._id,
      user: user._id,
      role: role,
      purchased: extraParams?.purchased,
      purchasedAt: extraParams?.purchased ? new Date() : undefined,
    }, {
      upsert: true,
      new: true,
    })
  }

  async getDatasetPermissionById (id: ObjectId) {
    const result = await DatasetPermission.findOne({
      _id: id
    }).populate<{ dataset: IDataset }>('dataset').populate<{ user: IUser }>('user')
    if (!result) {
      throw new NotFoundError('Permission object not found.')
    }
    return result
  }

  async getDatasetPermissionByUser<D extends IDataset, U extends IUser> (dataset: D, user: U): Promise<DatasetPermissionWithUserAndDataset> {
    const result = await DatasetPermission.findOne({
      dataset: dataset._id,
      user: user._id,
    }).populate<{ user: IUser }>('user').populate<{ dataset: IDataset }>('dataset')
    if (!result) {
      throw new NotFoundError('Permission object not found.')
    }
    return result
  }

  async editPermission (permission: DatasetPermissionWithUserAndDataset, newRole: DatasetRole) {
    permission.role = newRole
    await permission.save()
  }

  async revokePermission (permission: DatasetPermissionWithUserAndDataset) {
    await permission.deleteOne()
  }

  async requestDatasetPermission<D extends IDataset, U extends IUser> (dataset: D, params: {
    user: U,
    role: DatasetRole,
  }) {
    const datasetRepo = new DatasetRepository()
    try {
      datasetRepo.verifyDatasetOwner(dataset, params.user)
      return
    } catch (e) {
    }
    let permissions
    try {
      permissions = await this.getDatasetPermissionByUser(dataset, params.user)
      if (permissions.role === 'blocked') {
        throw new PermissionError('You are blocked from accessing this dataset.')
      }
      const actualRoleIndex = DATASET_ROLE_HIERARCHY.indexOf(permissions.role)
      const requestRoleIndex = DATASET_ROLE_HIERARCHY.indexOf(params.role)
      if (actualRoleIndex >= requestRoleIndex && requestRoleIndex !== -1 && actualRoleIndex !== -1) {
        return
      }
    } catch (e) {
      if (e instanceof PermissionError) {
        throw e
      }
    }
    if (!dataset.public) {
      throw new PermissionError('You do not have permissions for this dataset.')
    }
    if (params.role !== 'contributor' && params.role !== 'preview') {
      throw new PermissionError('You do not have permissions for this dataset.')
    }
    if (dataset.price > 0 && params.role !== 'preview') {
      throw new PermissionError('Access for this dataset needs to be purchased.')
    }
  }

  async aggregateDatasetPermissionsByDatasets<Dataset extends IDataset, User extends IUser> (datasets: Dataset[], user?: User) {
    const mapping: Record<string, DatasetRole> = {}
    if (user) {
      const permissions = await DatasetPermission.find({
        dataset: {
          $in: datasets.map(dataset => dataset._id)
        },
        user: user._id,
      })
      for await (let permission of permissions) {
        mapping[permission.dataset.toString()] = permission.role
      }
      for (let dataset of datasets) {
        // Owner match - override with owner permission if matches.
        if (dataset.user.equals(user._id)) {
          mapping[dataset._id.toString()] = 'owner'
        } else if (dataset.public) {
          // Public, free datasets allows everyone to contribute by default.
          if (dataset.price === 0) {
            mapping[dataset._id.toString()] ??= 'contributor'
          }
          // Public, paid datasets allows everyone to preview.
          else {
            mapping[dataset._id.toString()] ??= 'preview'
          }
        }
        // Otherwise the dataset cannot be accessed by default - how?
        else {
          mapping[dataset._id.toString()] ??= 'none'
        }
      }
    } else {
      for (let dataset of datasets) {
        // Owner match - override with owner permission if matches.
        if (dataset.public) {
          // Public, free datasets allows everyone to contribute by default.
          if (dataset.price === 0) {
            mapping[dataset._id.toString()] ??= 'contributor'
          }
          // Public, paid datasets allows everyone to preview.
          else {
            mapping[dataset._id.toString()] ??= 'preview'
          }
        }
        // Otherwise the dataset cannot be accessed by default - how?
        else {
          mapping[dataset._id.toString()] ??= 'none'
        }
      }
    }
    return Object.entries(mapping).map(([key, value]: [string, DatasetRole]) => {
      return {
        dataset: new ObjectId(key),
        role: value
      }
    })
  }

  async getSharedDatasets (query: {
    user: ObjectId;
    paid?: boolean;
    public?: boolean;
    recipe?: ObjectId;
    name?: string;
    sort?: Express.RequestSort;
    pagination?: Express.RequestPagination;
  }) {
    const permissionCollection = DatasetPermission.collection

    const matchStage: {
      public?: boolean,
      recipe?: ObjectId;
      $text?: {
        $search: string;
      };
      price?: number | {
        $gt: number;
      };
    } = {}

    if (query.name) {
      matchStage.$text = {
        $search: query.name
      }
    }
    if (query.recipe) {
      matchStage.recipe = query.recipe
    }
    if (query.public !== undefined) {
      matchStage.public = query.public
    }
    if (query.paid === true) {
      matchStage.price = {
        $gt: 0,
      }
    } else if (query.paid === false) {
      matchStage.price = 0
    }

    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          user: query.user,
          role: {
            $ne: 'blocked',
          }
        }
      },
      {
        $lookup: {
          from: Dataset.collection.collectionName,
          foreignField: '_id',
          localField: 'dataset',
          as: 'datasets',
        }
      },
      {
        $project: {
          dataset: {
            $first: '$datasets',
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: '$dataset',
        }
      },
      {
        $match: matchStage,
      }
    ]

    const { results, ...meta } = await aggregate<IDataset>(
      permissionCollection,
      {
        limit: query.pagination?.limit ?? 20,
        aggregation: pipeline,
        next: query.pagination?.next,
        previous: query.pagination?.previous,
        sortAscending: query.sort?.ascending,
        paginatedField: query.sort?.field,
      },
    )
    return {
      meta,
      data: results,
    }
  }
}
