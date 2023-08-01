import express from 'express'
import * as controller from './controllers'

export const nestedAnnotationRouter = express.Router({
  mergeParams: true,
})
export const rootAnnotationRouter = express.Router()

rootAnnotationRouter.get('/:id', controller.getPullRequestAnnotationById)
rootAnnotationRouter.patch('/:id', controller.editPullRequestAnnotation)
rootAnnotationRouter.delete('/:id', controller.deletePullRequestAnnotation)

nestedAnnotationRouter.get('/:id', controller.getPullRequestAnnotationByExistingAnnotation)
nestedAnnotationRouter.patch('/:id', controller.editExistingAnnotation)
nestedAnnotationRouter.delete('/:id', controller.deleteExistingAnnotation)
nestedAnnotationRouter.post('/:id/rollback', controller.revertExistingAnnotation)