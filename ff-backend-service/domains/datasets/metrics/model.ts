import { ObjectId } from '@/utils/abbreviations'
import mongoose, { HydratedDocument, Schema } from 'mongoose'
import z from 'zod'
import { MODEL_NAMES } from '@/configuration'

export const ActivityTypeEnum = z.enum(['view', 'download'])
export type ActivityType = z.infer<typeof ActivityTypeEnum>

export interface IActivityMetrics {
  dataset: ObjectId,
  type: ActivityType,
  count: number
  date: Date,
}

const ActivitySchema = new Schema<IActivityMetrics>({
  dataset: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.dataset
  },
  type: {
    type: String,
    enum: ['view', 'download'],
    required: true
  },
  date: {
    type: Date,
  },
  count: {
    type: Number
  },
})

ActivitySchema.pre('save', function (this: HydratedDocument<IActivityMetrics>, next) {
  if (!this.date) {
    this.date = new Date(new Date().setHours(0, 0, 0, 0)) // Set to midnight today
  }
  this.count = 0
  next()
})

ActivitySchema.index({ createdAt: 1, type: -1 })

const Activity = mongoose.model<IActivityMetrics>(
  MODEL_NAMES.activityMetrics,
  ActivitySchema
)

export default Activity
