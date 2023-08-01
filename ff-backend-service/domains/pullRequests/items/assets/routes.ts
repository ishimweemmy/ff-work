import express from 'express'
import * as controller from './controllers'
import * as annotationController from '@/domains/pullRequests/items/annotations/controllers'
import { checkAuthorized } from '@/middlewares/auth'
import { imageParser, miscParser } from '@/middlewares/multer'
import * as console from 'console'

export const nestedAssetRouter = express.Router({
  mergeParams: true,
})
export const rootAssetRouter = express.Router({})

nestedAssetRouter.use(checkAuthorized)

nestedAssetRouter.post(
  '/new/upload/image',
  imageParser.single('image'),
  controller.createNewPullRequestImage
)
nestedAssetRouter.post(
  '/new/upload/text',
  imageParser.single('text'),
  controller.createNewPullRequestTextAsset
)
nestedAssetRouter.post(
  '/new/upload/miscellaneous',
  miscParser.single('asset'),
  controller.createNewPullRequestMiscAsset
)
nestedAssetRouter.get('/new/', controller.searchPullRequestAssets)

rootAssetRouter.get('/new/:id', controller.getPullRequestAsset)
rootAssetRouter.delete('/new/:id', controller.deletePullRequestAsset)
rootAssetRouter.post('/new/:id/annotations', annotationController.addAnnotationToPullRequestAsset)

nestedAssetRouter.get('/existing/:id', controller.getExistingAssetInPullRequest)
nestedAssetRouter.delete('/existing/:id', controller.deleteExistingAsset)
nestedAssetRouter.post('/existing/:id/rollback', controller.revertDeletedExistingAsset)
nestedAssetRouter.post('/existing/:id/annotations', annotationController.addAnnotationToExistingAsset)

nestedAssetRouter.get('/altered', controller.searchExistingAssetsAlteredByPullRequest)
nestedAssetRouter.get('/deleted', controller.searchExistingAssetsDeletedByPullRequest)

export default nestedAssetRouter
