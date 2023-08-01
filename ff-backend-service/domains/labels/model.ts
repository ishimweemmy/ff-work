import mongoose from 'mongoose'
import Recipe from '@/domains/recipes/model'
import z from 'zod'
import { v4 } from 'uuid'

export const ANNOTATION_TOOL_ENUM = z.enum(['ellipse', 'boundingBox', 'line', 'polygon'])
export type AnnotationTool = z.infer<typeof ANNOTATION_TOOL_ENUM>

export interface ILabel {
  _id: mongoose.Types.ObjectId;
  recipe: mongoose.Types.ObjectId;
  tag: string;
  name: string;
  color: string;
  tool: AnnotationTool;
}

const LabelSchema = new mongoose.Schema<ILabel>({
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Recipe.modelName,
  },
  name: {
    type: String,
    required: true,
  },
  tool: {
    type: String,
    enum: ANNOTATION_TOOL_ENUM._def.values,
    required: true,
  },
  tag: {
    type: String,
    required: true,
    default: () => {
      return v4()
    }
  },
  color: {
    type: String,
    required: true,
    validate: {
      validator: function (color: string) {
        return /^#([0-9a-f]{3}){1,2}$/i.test(color)
      }
    }
  }
})

const Label = mongoose.model<ILabel>('Label', LabelSchema)
export default Label
