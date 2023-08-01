import mongoose from 'mongoose'
import { IDataset } from './model'
import DatasetRepository from './repository'
import { algorithmServer } from '@/utils/api'
import AbstractService from '@/utils/artifacts/AbstractService'
import { ObjectId } from '@/utils/abbreviations'
import AssetRepository from '@/domains/assets/repository'
import RecipeRepository from '@/domains/recipes/repository'
import LabelRepository from '../labels/repository'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import Asset from '@/domains/assets/model'
import DatasetLikeRepository from './like/repository'
import {
  expandCollectionAndMergeFields,
  expandCollectionIntoOneField,
} from '@/utils/repoUtils'
import UserRepository from '@/domains/users/repository'
import express from 'express'
import { DatasetExposedSearchQuery } from '@/domains/datasets/queries'

export default class DatasetService extends AbstractService {
  repo = new DatasetRepository()
  recipeRepo = new RecipeRepository()
  datasetRepo = new DatasetRepository()
  datasetLikeRepo = new DatasetLikeRepository()
  datasetPermissionRepo = new DatasetPermissionRepository()
  labelRepo = new LabelRepository()
  userRepo = new UserRepository()

  async getDataset (
    id: ObjectId,
    query: {
      expand: string[];
    }
  ) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'preview',
    })
    return (await this.repo.expandDatasetObjects([dataset], {
      expand: query.expand,
      user: this.user
    }))![0]
  }

  async deleteDataset (id: ObjectId) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'owner',
    })
    await this.repo.removeDataset(dataset)
  }

  async searchDatasets (query: DatasetExposedSearchQuery) {
    let queryResult
    if (query.public) {
      queryResult = await this.repo.searchDatasets({
        ...query,
        public: true,
      })
    } else {
      queryResult = await this.repo.searchDatasets({
        ...query,
        user: this.user._id,
      })
    }
    const result = await this.repo.expandDatasetObjects(
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

  async getDatasets (query: {
    expand: string[];
    pagination?: Express.RequestPagination;
  }) {
    const queryResult = await this.repo.getDatasets({
      ...query,
      user: this.user._id,
    })
    const result = await this.repo.expandDatasetObjects(queryResult.data, {
      expand: query.expand,
      user: this.user,
    })
    return {
      ...queryResult,
      data: result,
    }
  }

  async createDataset (datasetInfo: Partial<IDataset>) {
    if (!datasetInfo.recipe) {
      throw new Error('Missing recipe ID.')
    }
    const recipe = await this.recipeRepo.getRecipeById(datasetInfo.recipe)
    this.recipeRepo.verifyRecipeOwner(recipe, this.user)
    const newDataset = await this.repo.createDataset(
      {
        recipe: recipe,
      },
      {
        ...datasetInfo,
        user: this.user._id,
      }
    );
    if (datasetInfo.price !== undefined) {
      await this.repo.changeDatasetPrice(newDataset, datasetInfo.price);
    }
    return newDataset;
  }

  async changeDatasetPrice (id: ObjectId, newPrice: number) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    await this.repo.changeDatasetPrice(dataset, newPrice)
    await this.datasetRepo.updateDataset(dataset)
  }

  async changeDatasetPublicVisibility (id: ObjectId, publiclyVisible: boolean) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    await this.repo.changeDatasetPublicVisibility(dataset, publiclyVisible)
    await this.datasetRepo.updateDataset(dataset)
  }

  async editDataset (
    id: ObjectId,
    params: {
      name?: string;
      tags?: string[];
      subTags?: string[];
      description?: string;
    }
  ) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    await this.repo.editDataset(dataset, params)
    await this.datasetRepo.updateDataset(dataset)
  }

  async editDatasetIcon (
    id: ObjectId,
    icon: Express.Multer.File
  ) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    await this.repo.editDatasetIcon(dataset, icon)
    await this.datasetRepo.updateDataset(dataset)
  }

  async editDatasetThumbnail (
    id: ObjectId,
    thumbnail: Express.Multer.File
  ) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    await this.repo.editDatasetThumbnail(dataset, thumbnail)
    await this.datasetRepo.updateDataset(dataset)
  }

  async createDatasetPurchaseSession (id: ObjectId) {
    const dataset = await this.repo.getDatasetById(id)
    return await this.repo.createDatasetPurchaseSession(dataset, this.user)
  }

  async initiateFlockfyshTraining (
    datasetId: ObjectId,
    parameters: {
      desired_data: number;
      class_search_queries: mongoose.Types.Map<string[]>;
    }
  ) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    dataset.desiredDatasetSize = parameters.desired_data
    dataset.classSearchQueries = parameters.class_search_queries
    await dataset.save()
    await this.datasetRepo.updateDataset(dataset)
    const url = `/flockfysh-receiver/${dataset.id}`
    return (
      await algorithmServer.post(url, {
        epochs: 2000,
      })
    ).data
  }

  async continueFlockfyshTraining (datasetId: ObjectId) {
    const dataset = await this.datasetRepo.getDatasetById(datasetId)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    const url = `/flockfysh-receiver/${dataset.id}`
    await this.datasetRepo.updateDataset(dataset)
    return (await algorithmServer.post(url, { epochs: 2000 })).data
  }

  async getDatasetTaskProgress (id: mongoose.Types.ObjectId) {
    const dataset = await this.repo.getDatasetById(id)

    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'contributor',
    })

    const taskId = dataset.id

    let result
    if (!taskId) {
      result = { state: 'pending' }
    } else {
      result = (await algorithmServer.get(`/status/${taskId}`)).data
    }
    return { ...result, taskInProgress: dataset.taskInProgress }
  }

  async getLabels (id: mongoose.Types.ObjectId) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'contributor',
    })
    const recipeId = dataset.recipe
    const recipe = await this.recipeRepo.getRecipeById(recipeId)
    return await this.labelRepo.getLabelsByRecipe(recipe)
  }

  async changeDatasetLicense (id: mongoose.Types.ObjectId, license: Flockfysh.DatasetLicense) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'admin',
    })
    await this.repo.changeDatasetLicense(dataset, license)
  }

  async transferDatasetOwnership (id: mongoose.Types.ObjectId, params: {
    username: string;
    retainAdmin?: boolean;
  }) {
    const dataset = await this.repo.getDatasetById(id)
    await this.datasetPermissionRepo.requestDatasetPermission(dataset, {
      user: this.user,
      role: 'owner',
    })
    const user = await this.userRepo.findUserByUsername(params.username)
    if (params.retainAdmin) {
      await this.datasetPermissionRepo.assignPermission(dataset, this.user, 'admin')
    }
    await this.datasetRepo.transferDatasetOwnership(dataset, user)
  }
}
