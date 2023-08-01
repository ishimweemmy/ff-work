import express from 'express'
import * as postController from './controller'
import * as likesController from './like/controllers'
import { checkAuthorized } from '@/middlewares/auth'

const router = express.Router()

router.use(checkAuthorized)
router.post("/", postController.createPost)
router.get("/", postController.getPosts)
router.get('/:id', postController.getPost)
router.put('/:id', postController.updatePost)
router.delete('/:id', postController.deletePost)

router.get('/:id/likes/count', likesController.getLikeCountOfPost)
router.get('/:id/likes', likesController.checkIfPostLiked)
router.post('/:id/likes', likesController.likePost)
router.delete('/:id/likes', likesController.unlikePost)

export default router
