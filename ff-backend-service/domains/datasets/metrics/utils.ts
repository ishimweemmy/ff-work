import { HydratedDocument } from "mongoose"
import { IDataset } from "../model"

export function createMetricsCountPipeline(dataset: HydratedDocument<IDataset>, type: string) {
  const matchStage = { $match: { dataset: dataset._id, type: type } }
  const groupStage = { $group: { _id: null, totalCount: { $sum: '$count' } } }
  return [matchStage, groupStage]
}