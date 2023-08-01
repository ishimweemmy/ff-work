import {Router} from 'express'
import * as collectionController from './controllers'
import { checkAuthorized } from '@/middlewares/auth'
import { nestedCollectionItemRouter } from '@/domains/collections/items/routes'

const router = Router()

router.use(checkAuthorized)
router.get('/', collectionController.getCollections)
router.get('/search', collectionController.searchCollections)
router.post('/', collectionController.createCollection)
router.get('/:id', collectionController.getCollectionDetails)
router.delete('/:id', collectionController.deleteCollection)
router.patch('/:id', collectionController.editCollection)
router.patch('/:id/visibility', collectionController.changeCollectionPublicVisibility)
router.patch('/:id/thumbnail', collectionController.editCollectionThumbnail)
router.patch('/:id/icon', collectionController.editCollectionIcon)

router.use("/:collectionId/datasets", nestedCollectionItemRouter)

export default router
