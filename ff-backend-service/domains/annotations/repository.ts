import Annotation, { IAnnotation } from './model'
import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { HydratedDocument } from 'mongoose'
import { NotFoundError, UserMismatchError } from '@/utils/errors'
import Asset, { IAsset } from '@/domains/assets/model'
import { ObjectId } from '@/utils/abbreviations'
import Dataset, { IDataset } from '@/domains/datasets/model'
import { PopulatedAsset } from '@/domains/assets/repository'
import Label, { ILabel } from '@/domains/labels/model'
import { createAnnotationCountPipelineOfDatasets } from '@/domains/annotations/repoUtils'

export type EditAnnotationParams = Pick<IAnnotation, 'data' | 'label' | 'frame'>
export type PopulatedAnnotation = Awaited<ReturnType<AnnotationRepository['getAnnotationById']>>

export default class AnnotationRepository extends AbstractRepository {
  async getAnnotationById (id: ObjectId) {
    const annotationBox = await Annotation.findById(id).populate<{ asset: IAsset & { dataset: IDataset }, label: ILabel }>({
      path: 'asset',
      model: Asset,
      populate: {
        path: 'dataset',
        model: Dataset,
      }
    }).populate({
      path: 'label',
      model: Label,
    })
    if (!annotationBox) throw new NotFoundError('Annotation not found.')
    return annotationBox
  }

  async getAnnotationsByAsset (asset: PopulatedAsset) {
    return Annotation.find({ asset: asset._id }).populate<{ label: ILabel }>({
      path: 'label',
      model: Label,
    })
  }

  async createAnnotation (asset: PopulatedAsset, createData: Partial<IAnnotation>): Promise<HydratedDocument<IAnnotation>> {
    return await Annotation.create({
      ...createData,
      asset: asset._id,
    })
  }

  async depopulateAndEditAnnotation (annotationBox: PopulatedAnnotation, annotationBoxData: EditAnnotationParams) {
    let depopulatedBox = annotationBox.depopulate()
    depopulatedBox.data = annotationBoxData.data
    depopulatedBox.label = annotationBoxData.label
    depopulatedBox.frame = annotationBoxData.frame
    return await annotationBox.save()
  }

  async deleteAnnotation (annotation: PopulatedAnnotation) {
    return await annotation.remove()
  }

  async deleteAnnotationsByAsset (asset: PopulatedAsset) {
    return Annotation.deleteMany({
      asset: asset._id,
    })
  }

  async deleteAnnotationsByDataset (dataset: HydratedDocument<IDataset>) {
    await Annotation.aggregate([
      {
        $lookup: {
          from: Asset.collection.collectionName,
          localField: 'asset',
          foreignField: '_id',
          as: 'asset',
        },
      },
      {
        $match: {
          'asset.dataset': dataset._id,
        }
      },
      {
        $set: {
          __deleted: true,
        }
      },
      {
        $merge: {
          into: Annotation.collection.collectionName,
        }
      }
    ])
    await Annotation.deleteMany({ __deleted: true })
  }

  async aggregateAnnotationCountsByDatasets<T extends IDataset>(datasets: T[]) {
    const ids = datasets.map(item => item._id);
    type RawAggregationResult = {
      total: {
        dataset: ObjectId;
        count: number;
      }[]
    }
    type IntermediateAggregationItem = {
      total: number;
    }
    type FinalAggregationResult = {
      dataset: ObjectId;
      total: number;
    }[]
    const rawResult = (await Annotation.aggregate<RawAggregationResult>(createAnnotationCountPipelineOfDatasets(ids)))[0];
    const intermediate: Record<string, IntermediateAggregationItem> = {};
    for (let item of rawResult.total) {
      intermediate[item.dataset.toString()] ??= {} as IntermediateAggregationItem;
      intermediate[item.dataset.toString()].total = item.count;
    }
    for (let dataset of datasets) {
      intermediate[dataset._id.toString()] ??= {} as IntermediateAggregationItem;
      intermediate[dataset._id.toString()].total ??= 0;
    }
    let result: FinalAggregationResult = [...Object.entries(intermediate)].map(([key, item]) => {
      return {
        dataset: new ObjectId(key),
        total: item.total,
      }
    });
    return result;
  }

  verifyAnnotationOwner (annotation: PopulatedAnnotation, user: Express.User) {
    if (!(annotation.asset.dataset.user.equals(user._id))) {
      throw new UserMismatchError('You do not own this annotation object.')
    }
  }
}
