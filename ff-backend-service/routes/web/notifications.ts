import express from 'express'
import {
  createNotificationSubscription,
  getPublicSubscriptionKey
} from '../../domains/notifications/push'
import { checkAuthorized } from '../../middlewares/auth'

const router = express.Router()

router.use(checkAuthorized)
router.get('/pushKey', getPublicSubscriptionKey)
router.post('/subscribe', createNotificationSubscription)

export default router
