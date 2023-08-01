import { ObjectId } from '@/utils/abbreviations'
import mongoose, { HydratedDocument, mongo } from 'mongoose'
import { MODEL_NAMES } from '@/configuration'
import { MongooseCursorPaginationModel } from 'mongo-cursor-pagination'
import Annotation, {
  IAnnotation,
  IAnnotationData,
  validateBoundingBox,
  validateEllipse, validateLine, validatePolygon
} from '@/domains/annotations/model'
import PullRequestAsset, { IPullRequestAsset } from '@/domains/pullRequests/items/assets/assetModel'
import Asset, { IAsset } from '@/domains/assets/model'
import PullRequest, { IPullRequest } from '@/domains/pullRequests/model'
import { IDataset } from '@/domains/datasets/model'
import Label, { AnnotationTool } from '@/domains/labels/model'
import { NotFoundError } from '@/utils/errors'
import * as datasetUtils from '@/domains/datasets/utils'

export interface IPullRequestAnnotationInfo {
  label: ObjectId;
  data: IAnnotationData;
  frame?: number;
}

export interface IPullRequestAnnotation {
  _id: ObjectId;
  itemType: 'annotation',
  pullRequest: ObjectId;
  targetedAsset?: ObjectId;
  targetedPullRequestAsset?: ObjectId;
  targetedAnnotation?: ObjectId;
  newAnnotation?: IPullRequestAnnotationInfo;
  oldAnnotation?: IPullRequestAnnotationInfo;
  __deleted?: boolean;
}

async function validatePullRequestAnnotation (this: HydratedDocument<IPullRequestAnnotation>, annotation?: IPullRequestAnnotationInfo) {
  if (!annotation) return true
  const pullRequest = await PullRequest.findOne({
    _id: this.pullRequest._id
  }).populate<{
    dataset: IDataset
  }>({
    path: 'dataset',
  })
  if (!pullRequest) {
    throw new Error('Targeted pull request is not found or has been deleted.')
  }
  const label = await Label.findOne({
    _id: annotation.label._id,
  })
  if (!label) {
    throw new Error('Label not found or has been deleted.')
  }
  if (!label.recipe.equals(pullRequest.dataset.recipe)) {
    throw new Error('Label must belong to the recipe belonging to the PR\'s dataset.')
  }
  const validatorMap: Record<AnnotationTool, (data: any) => boolean> = {
    boundingBox: validateBoundingBox,
    ellipse: validateEllipse,
    line: validateLine,
    polygon: validatePolygon,
  }
  const validatorFunction = validatorMap[label.tool]
  if (!validatorFunction) {
    throw new Error('Bad label type.')
  }
  return validatorFunction(annotation.data)
}

const PullRequestAnnotationObjectSchema = new mongoose.Schema<IPullRequestAnnotationInfo>({
  label: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.label,
    required: true,
  },
  frame: {
    type: Number,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  }
})

const PullRequestAnnotationSchema = new mongoose.Schema<IPullRequestAnnotation>({
  itemType: {
    type: String,
    enum: ['annotation'],
    default: 'annotation',
    required: true,
  },
  pullRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.pullRequest,
    required: true,
    validate: {
      async validator (this: HydratedDocument<IPullRequestAnnotation>, pullRequestOrId: IPullRequest | ObjectId) {
        const pullRequest = await PullRequest.findOne({
          _id: pullRequestOrId._id,
        }).populate<{ dataset: IDataset }>('dataset')
        if (!pullRequest) {
          throw new NotFoundError('Pull request is not attached to the dataset.')
        }
        datasetUtils.verifyAnnotationCompatibility(pullRequest.dataset)
        return true
      }
    }
  },
  targetedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.asset,
    validate: {
      async validator (this: HydratedDocument<IPullRequestAnnotation>, assetOrId?: IAsset | ObjectId) {
        if (!assetOrId) return true
        const id = assetOrId._id
        const asset = await Asset.findOne({
          _id: id,
        })
        if (!asset) {
          throw new Error('Cannot find asset to bind the annotation to.')
        }
        const pullRequest = await PullRequest.findOne({
          _id: this.pullRequest._id,
        })
        if (!pullRequest) {
          throw new Error('This pull request is not found or has been deleted.')
        }
        if (!pullRequest.dataset.equals(asset.dataset)) {
          throw new Error('Asset must belong to the same dataset as the pull request.')
        }
        return true
      }
    }
  },
  targetedPullRequestAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.pullRequestAsset,
    validate: {
      async validator (this: HydratedDocument<IPullRequestAnnotation>, assetOrId?: IPullRequestAsset | ObjectId) {
        if (!assetOrId) return true
        const id = assetOrId._id
        const pullRequestAsset = await PullRequestAsset.findOne({
          _id: id,
        })
        if (!pullRequestAsset) {
          throw new Error('Cannot find asset to bind the annotation to.')
        }
        if (!pullRequestAsset.pullRequest.equals(this.pullRequest._id)) {
          throw new Error('Targeted asset\'s must belong to the pull request specified in this annotation object.')
        }
        return true
      }
    }
  },
  targetedAnnotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.annotation,
    validate: {
      async validator (this: HydratedDocument<IPullRequestAnnotation>, targetedAnnotationOrId?: IAnnotation | ObjectId) {
        if (!targetedAnnotationOrId) return true
        const id = targetedAnnotationOrId._id
        const targetedAnnotation = await Annotation.findOne({
          _id: id,
        }).populate<{ asset: IAsset }>('asset')
        if (!targetedAnnotation) {
          throw new Error('Annotation is not found - it might have been deleted.')
        }
        const pullRequest = await PullRequest.findOne({
          _id: this.pullRequest._id
        })
        if (!pullRequest) {
          throw new Error('Targeted pull request is not found or has been deleted.')
        }
        if (!targetedAnnotation.asset.dataset.equals(pullRequest.dataset)) {
          throw new Error('Targeted annotation must belong to the same dataset as its targeted pull request.')
        }
        return true
      }
    }
  },
  newAnnotation: {
    type: PullRequestAnnotationObjectSchema,
    validate: {
      validator: validatePullRequestAnnotation
    }
  },
  oldAnnotation: {
    type: PullRequestAnnotationObjectSchema,
    validate: {
      validator: validatePullRequestAnnotation,
    }
  },
  __deleted: {
    type: Boolean,
  }
})

const PullRequestAnnotation = mongoose.model<IPullRequestAnnotation, MongooseCursorPaginationModel<IPullRequestAnnotation>>(MODEL_NAMES.pullRequestAnnotation, PullRequestAnnotationSchema)

export default PullRequestAnnotation