import { Router } from 'express'
import datasetRouter from './dataset'

const router = Router()

router.use('/dataset', datasetRouter)

export default router;