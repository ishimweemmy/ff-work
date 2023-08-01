import express from 'express'
import { getDatasetAssets, getDatasets, getDataset } from '../controllers'
import { checkAuthorized } from '@/middlewares/auth'

const router = express.Router()

router.use(checkAuthorized)
router.get('/:id/assets', getDatasetAssets)
router.get('/:id/', getDataset)
router.get('/', getDatasets)

export default router
