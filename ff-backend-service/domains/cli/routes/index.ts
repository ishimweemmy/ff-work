import express from 'express'
import datasetRouter from './datasets'
import assetRouter from './assets'
import { parseAuthorizationHeader } from '@/domains/users/controllers/auth/AccessTokenController'

const router = express.Router()

router.use(parseAuthorizationHeader)
router.get('/', (req, res) => {
  const user = req.user!.toJSON()
  delete user.password
  res.json({
    success: true,
    data: {
      message: 'Flockfysh CLI endpoints functional!',
      user,
    },
  })
})
router.use('/datasets', datasetRouter)
router.use('/assets', assetRouter)

export default router
