import express from 'express'
import * as datasetController from '../../domains/datasets/controllers'

const router = express.Router()

router.post('/complete/:datasetId', datasetController.completeDataset)

export default router
