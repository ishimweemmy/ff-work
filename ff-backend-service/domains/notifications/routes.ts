import { Router } from 'express'
import bellRouter from './bell/routes'

const router = Router()

router.use('/bell', bellRouter)

export default router