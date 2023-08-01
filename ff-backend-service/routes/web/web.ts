import authRouter from '@/domains/users/AuthRoutes'
import imageRouter from '@/domains/assets/routes'
import datasetRouter from '@/domains/datasets/routes'
import annotationRouter from '@/domains/annotations/routes'
import notificationRouter from '@/domains/notifications/routes'
import recipeRouter from '@/domains/recipes/routes'
import labelRouter from '@/domains/labels/routes'
import datasetPermissionRouter from '@/domains/datasets/permissions/routes'
import pullRequestRouter from '@/domains/pullRequests/routes'
import paymentRouter from '../../domains/payments/PaymentRoutes'
import userRouter from '@/domains/users/userRoutes'
import postRouter from '@/domains/posts/routes'
import express from "express";

const router = express.Router()

router.use('/auth', authRouter)
router.use('/users', userRouter)
router.use('/assets', imageRouter)
router.use('/datasets', datasetRouter)
router.use('/posts', postRouter)
router.use('/annotations', annotationRouter)
router.use('/pullRequests', pullRequestRouter)
router.use('/datasetPermissions', datasetPermissionRouter)
router.use('/recipes', recipeRouter)
router.use('/labels', labelRouter)
router.use('/notifications', notificationRouter)
router.use('/payments', paymentRouter)

export default router
