import express from 'express'
import * as pullRequestMessageController from './controllers'

export const rootMessageRouter = express.Router()
export const nestedMessageRouter = express.Router({
  mergeParams: true,
})

rootMessageRouter.delete('/:id', pullRequestMessageController.deletePullRequestMessage)
rootMessageRouter.patch('/:id', pullRequestMessageController.editPullRequestMessage)
nestedMessageRouter.get('/', pullRequestMessageController.getPullRequestMessages)
nestedMessageRouter.post('/', pullRequestMessageController.createPullRequestMessage)