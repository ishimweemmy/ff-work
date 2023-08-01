import mongoose, { Document, HydratedDocument, PopulatedDoc } from 'mongoose'
import z from 'zod'
import Label, { AnnotationTool, ILabel } from '@/domains/labels/model'
import { ObjectId } from '@/utils/abbreviations'
import { IDataset } from '@/domains/datasets/model'
import { MODEL_NAMES } from '@/configuration'
import Asset, { IAsset } from '@/domains/assets/model'
import { InvalidOperationError, NotFoundError } from '@/utils/errors'
import * as datasetUtils from '@/domains/datasets/utils'

// Relative to width and height.
type Point = [number, number];
type Dimensions = [number, number];

interface IBaseAnnotation {
  _id: ObjectId;
  asset: mongoose.Types.ObjectId; // Rename image ID to asset ID
  frame?: number; // If the asset is a video, this can be handy.
  label: mongoose.Types.ObjectId; // Change classes to labels
  data: IBaseShapeData;
  __deleted?: boolean;
}

interface IBaseShapeData {}

export interface IBoundingBoxData extends IBaseShapeData {
  center: Point;
  dimensions: Dimensions;
  rotation: number;
}

export interface IEllipseData extends IBaseShapeData {
  center: Point;
  dimensions: Dimensions;
  rotation: number;
}

export interface ILineData extends IBaseShapeData {
  points: [Point, Point];
}

export interface IPolygonData extends IBaseShapeData {
  points: Point[];
}

export interface IBoundingBox extends IBaseAnnotation {
  data: IBoundingBoxData;
}

export interface IEllipse extends IBaseAnnotation {
  data: IEllipseData;
}

export interface ILine extends IBaseAnnotation {
  data: ILineData;
}

export interface IPolygon extends IBaseAnnotation {
  data: IPolygonData;
}

export type IAnnotationData = IBoundingBoxData | IEllipseData | ILineData | IPolygonData;
export type IAnnotation = IBoundingBox | IEllipse | ILine | IPolygon;

export function validatePoint (data: Point) {
  z.array(z.number()).length(2).parse(data)
}

export function validateDimension (data: Dimensions) {
  z.array(z.number()).length(2).parse(data)
}

export function validateBoundingBox (data: IBoundingBoxData): boolean {
  try {
    validateDimension(data.dimensions)
    validatePoint(data.center)
    z.number().safe().parse(data.rotation)
    return true
  } catch (e) {
    return false
  }
}

export function validateEllipse (data: IEllipseData): boolean {
  try {
    validateDimension(data.dimensions)
    validatePoint(data.center)
    z.number().safe().parse(data.rotation)
    return true
  } catch (e) {
    return false
  }
}

export function validateLine (data: ILineData): boolean {
  try {
    z.array(z.array(z.number()).length(2)).length(2).parse(data.points)
    return true
  } catch (e) {
    return false
  }
}

export function validatePolygon (data: IPolygonData): boolean {
  try {
    z.array(z.array(z.number()).length(2)).parse(data.points)
    return true
  } catch (e) {
    return false
  }
}

async function validateAnnotationData (this: mongoose.HydratedDocument<IAnnotation> | mongoose.HydratedDocument<IAnnotation & {
  label: PopulatedDoc<Document<ObjectId> & ILabel>;
}>): Promise<boolean> {
  const validatorMap: Record<AnnotationTool, (data: any) => boolean> = {
    boundingBox: validateBoundingBox,
    ellipse: validateEllipse,
    line: validateLine,
    polygon: validatePolygon,
  }
  const label = await Label.findById(this.label._id)
  if (!label) {
    throw new Error('Missing label information.')
  }
  if (!this.data) {
    throw new Error('Missing annotation data.')
  }
  const validatorFunction = validatorMap[label.tool]
  if (!validatorFunction) {
    throw new Error('Bad label type.')
  }
  return validatorFunction(this.data)
}

async function validateLabel (this: mongoose.HydratedDocument<IAnnotation>) {
  const asset = await Asset.findById(this.asset._id).populate<{ dataset: IDataset }>('dataset')
  const label = await Label.findById(this.label._id)
  if (!label) {
    return false
  }
  if (!asset) {
    return false
  }
  if (!label.recipe.equals(asset.dataset.recipe)) {
    return false
  }
}

const annotationSchema = new mongoose.Schema<IAnnotation>({
  label: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: MODEL_NAMES.label,
    validate: {
      validator: validateLabel
    }
  },
  frame: Number,
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: validateAnnotationData,
    },
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.asset,
    required: true,
    validate: {
      async validator (this: HydratedDocument<IAsset>, asset: ObjectId) {
        const fetchedAsset = await Asset.findOne({
          _id: asset._id
        }).populate<{ dataset: IDataset }>('dataset')
        if (!fetchedAsset) {
          throw new NotFoundError('Missing asset.')
        }
        datasetUtils.verifyAnnotationCompatibility(fetchedAsset.dataset)
        return true
      }
    }
  },
  __deleted: Boolean,
})

annotationSchema.set('toJSON', {
  virtuals: true
})

const Annotation = mongoose.model<IAnnotation>('Annotation', annotationSchema)

export default Annotation
