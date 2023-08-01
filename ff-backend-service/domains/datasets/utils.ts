import Dataset, { IDataset } from '@/domains/datasets/model'
import { InvalidOperationError } from '@/utils/errors'
import { ObjectId } from '@/utils/abbreviations'
import mongoose from 'mongoose'

export function verifyAnnotationCompatibility<T extends IDataset> (dataset: T) {
  const acceptedTypes: Flockfysh.SupportedAssetType[] = ['image', 'video']
  if (!acceptedTypes.includes(dataset.type)) {
    throw new InvalidOperationError('This dataset does not support annotations.')
  }
}

// If the dataset type is set to "other", any asset type is accepted.
// Otherwise, the asset type must match dataset type.
export function verifyAssetTypeCompatibility<T extends IDataset> (dataset: T, type: Flockfysh.SupportedAssetType) {
  if (dataset.type !== 'other' && dataset.type !== type) {
    throw new InvalidOperationError(`This dataset cannot contain assets of type ${type}.`)
  }
}

export function createDatasetSearchPipeline(query: {
  paid?: boolean;
  public?: boolean;
  user?: mongoose.Types.ObjectId;
  recipe?: ObjectId;
  name?: string;
  sort?: Express.RequestSort;
  pagination?: Express.RequestPagination;
}) {
  const matchStage: {
    public?: boolean,
    user?: ObjectId;
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
  if (query.user) {
    matchStage.user = query.user
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

  const aggregationPipeline: mongoose.PipelineStage[] = [{
    $match: matchStage,
  }]
  return aggregationPipeline;
}
