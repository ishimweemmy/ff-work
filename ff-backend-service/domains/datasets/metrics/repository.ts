import AbstractRepository from '@/utils/artifacts/AbstractRepository'
import { HydratedDocument } from 'mongoose'
import Activity from './model'
import { IDataset } from '../model'
import { createMetricsCountPipeline } from './utils'
import dayjs from 'dayjs'
import * as console from 'console'

export default class ActivityRepository extends AbstractRepository {
  async getDatasetViews (dataset: HydratedDocument<IDataset>) {
    const countPipeline = createMetricsCountPipeline(dataset, 'view')
    const ag = await Activity.aggregate(countPipeline).exec()
    return ag[0]?.totalCount ?? 0
  }

  async getDatasetDownloads (dataset: HydratedDocument<IDataset>) {
    const countPipeline = createMetricsCountPipeline(dataset, 'download')
    const ag = await Activity.aggregate(countPipeline).exec()
    return ag[0]?.totalCount ?? 0
  }

  async getDatasetActivity (dataset: HydratedDocument<IDataset>, periodLengthInDays: number) {
    return Activity.find({
      dataset: dataset._id,
      date: {
        $gt: new Date(+dayjs().subtract(periodLengthInDays, 'days')),
      }
    }).sort({
      date: 1,
    })
  }

  async addDatasetView (dataset: HydratedDocument<IDataset>) {
    await Activity.findOneAndUpdate(
      { dataset: dataset._id, type: 'view', date: new Date(new Date().setHours(0, 0, 0, 0)) },
      { $inc: { count: 1 } },
      { upsert: true }
    )
  }

  async addDatasetDownload (dataset: HydratedDocument<IDataset>) {
    await Activity.findOneAndUpdate(
      { dataset: dataset._id, type: 'download', date: new Date(new Date().setHours(0, 0, 0, 0)) },
      { $inc: { count: 1 } },
      { upsert: true }
    )
  }
}
