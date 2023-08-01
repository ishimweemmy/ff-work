import { Router } from 'express'
import * as imageController from './controllers'
import * as annotationController from '../annotations/controllers'
import { checkAuthorized } from '@/middlewares/auth'

const router = Router()

router.use(checkAuthorized)
router.delete('/:id', imageController.deleteAsset)
router.get('/:id', imageController.getAssetById)
router.get('/:assetId/annotations', annotationController.getAnnotationsByAssetId)
router.delete('/:assetId/annotations', annotationController.clearAnnotationsByAssetId)
router.post("/:assetId/annotations", annotationController.addAnnotation);


export default router
