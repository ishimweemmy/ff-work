import { Router } from 'express'
import * as datasetController from './controllers'
import { checkAuthorized } from '@/middlewares/auth'
import { imageParser, miscParser, textParser } from '@/middlewares/multer'
import * as assetController from '@/domains/assets/controllers'
import * as likesController from '@/domains/datasets/like/controllers'
import * as bookmarksController from '@/domains/datasets/bookmark/controllers'
import * as datasetPermissionController from '@/domains/datasets/permissions/controllers'
import * as pullRequestController from '@/domains/pullRequests/controllers'
import * as metricsController from '@/domains/datasets/metrics/controllers'

const router = Router()

// Public routes
router.get('/search', datasetController.searchDatasets)

// Private routes
router.use(checkAuthorized)
router.get('/', datasetController.getDatasets)
router.get('/search/shared', datasetPermissionController.getSharedDatasets)
router.get('/search/bookmarked', bookmarksController.getBookmarkedDatasets)
router.post('/', datasetController.createDataset)
router.get('/:id', datasetController.getDatasetDetails)
router.delete('/:id', datasetController.deleteDataset)
router.get('/:id/stage', datasetController.getDatasetStage)
router.post(
  '/:id/initializeTraining',
  datasetController.initiateFlockfyshTraining
)
router.post(
  '/:id/continueTraining',
  datasetController.continueFlockfyshTraining
)
router.get('/:id/progress', datasetController.getDatasetTaskProgress)
router.patch('/:id', datasetController.editDataset)
router.patch('/:id/price', datasetController.changeDatasetPrice)
router.patch('/:id/license', datasetController.changeDatasetLicense)
router.patch(
  '/:id/visibility',
  datasetController.changeDatasetPublicVisibility
)
router.patch('/:id/thumbnail', datasetController.editDatasetThumbnail)
router.patch('/:id/icon', datasetController.editDatasetIcon)
router.post('/:id/purchase', datasetController.createDatasetPurchaseSession)

router.get('/:id/labels', datasetController.getLabels)

router.get('/:datasetId/assets/ids', assetController.getAssetIdsByDatasetId)
router.get('/:datasetId/assets', assetController.getAssetsByDatasetId)
router.post(
  '/:datasetId/assets/upload/text',
  textParser.single('text'),
  assetController.addTextAssetToDataset
)
router.post(
  '/:datasetId/assets/upload/image',
  imageParser.single('image'),
  assetController.addImageToDataset
)
router.post(
  '/:datasetId/assets/upload/miscellaneous',
  miscParser.single('asset'),
  assetController.addMiscAssetToDataset
)
router.patch(
  '/:id/ownership',
  datasetController.transferDatasetOwnership
)

router.get('/:datasetId/likes/count', likesController.getLikeCountOfDataset)
router.get('/:datasetId/likes', likesController.checkIfDatasetLiked)
router.post('/:datasetId/likes', likesController.likeDataset)
router.delete('/:datasetId/likes', likesController.unlikeDataset)

router.get('/:datasetId/bookmarks/count', bookmarksController.getBookmarkCountOfDataset)
router.get('/:datasetId/bookmarks', bookmarksController.checkIfDatasetBookmarked)
router.post('/:datasetId/bookmarks', bookmarksController.bookmarkDataset)
router.delete('/:datasetId/bookmarks', bookmarksController.unbookmarkDataset)

router.get(
  '/:datasetId/permissions',
  datasetPermissionController.getPaginatedDatasetPermissionsByDatasetId
)
router.get(
  '/:datasetId/permissions/search',
  datasetPermissionController.searchPaginatedDatasetPermissionsByDatasetId
)
router.post(
  '/:datasetId/permissions',
  datasetPermissionController.assignDatasetPermissionToUser
)

router.get(
  '/:datasetId/pullRequests',
  pullRequestController.searchPullRequestsByDatasetId,
)
router.post(
  '/:datasetId/pullRequests',
  pullRequestController.createPullRequest,
)

router.get('/:datasetId/metrics', metricsController.getDatasetMetrics)
router.get('/:datasetId/activity', metricsController.getDatasetActivity)
router.post('/:datasetId/metrics', metricsController.addMetricsToDataset)

export default router
