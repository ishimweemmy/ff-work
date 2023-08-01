import { Router, raw } from 'express'
import * as paymentsController from './PaymentController'
import { checkAuthorized } from '@/middlewares/auth'

const router = Router()

router.use(checkAuthorized)
router.post('/createUserSubscriptionUrl', paymentsController.createUserSubscriptionUrl)
router.get('/portal', paymentsController.portalSession)
export default router
