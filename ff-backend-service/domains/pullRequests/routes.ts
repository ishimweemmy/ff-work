import express from 'express'
import { checkAuthorized } from '@/middlewares/auth'
import * as controllers from './controllers'
import { rootAssetRouter, nestedAssetRouter } from './items/assets/routes'
import { nestedAnnotationRouter, rootAnnotationRouter } from '@/domains/pullRequests/items/annotations/routes'
import { nestedMessageRouter, rootMessageRouter } from '@/domains/pullRequests/messages/routes'
import * as console from 'console'

const router = express.Router()

router.use(checkAuthorized)
router.get('/:id', controllers.getPullRequestById)
router.patch('/:id', controllers.editPullRequest)
router.patch('/:id/status', controllers.changePullRequestStatus)
router.post('/:id/merge', controllers.mergePullRequest)
router.delete('/:id', controllers.deletePullRequest)

router.use('/:pullRequestId/assets', nestedAssetRouter)
router.use('/assets', rootAssetRouter)

router.use('/:pullRequestId/annotations', nestedAnnotationRouter)
router.use('/annotations', rootAnnotationRouter)

router.use('/:pullRequestId/messages', nestedMessageRouter)
router.use('/messages', rootMessageRouter)

export default router
