import express from 'express'
import * as userController from './controllers'
import { imageParser } from '@/middlewares/multer'
import { checkAuthorized } from '@/middlewares/auth'

const router = express.Router()

router.get('/byUsername/:username', checkAuthorized, userController.getUserByUsername)
router.get('/search', checkAuthorized, userController.searchUsers)
router.get('/:id', userController.getUser)
router.get('/byUsername/:username/followers', checkAuthorized, userController.getFollowers)
router.get('/byUsername/:username/followings', checkAuthorized, userController.getFollowings)
router.get('/byUsername/:username/isFollowing', checkAuthorized, userController.getIsFollowing)
router.get('/byUsername/:username/links', checkAuthorized, userController.getUserLinks)
router.put('/profilePhoto', checkAuthorized, imageParser.single('image'), userController.changeProfilePhoto)
router.put('/headerPhoto', checkAuthorized, imageParser.single('image'), userController.changeHeaderPhoto)
router.put('/byUsername/:username/follow', checkAuthorized, userController.addFollower)
router.put('/byUsername/:username/unfollow', checkAuthorized, userController.removeFollower)
router.put('/links', checkAuthorized, userController.changeLinks)
router.patch('/username', checkAuthorized, userController.changeUsername)
router.patch('/password', checkAuthorized, userController.changePassword)
router.patch('/email', checkAuthorized, userController.changeEmail)
router.post('/verifyEmail', checkAuthorized, userController.verifyEmail)
router.post('/payout/onboarding', checkAuthorized, userController.getPayoutOnboardingLink)
router.post('/payout/dashboard', checkAuthorized, userController.getPayoutDashboardLink)
router.get('/payout/onboarding', checkAuthorized, userController.getPayoutOnboardingState)
router.post('/customer/portal', checkAuthorized, userController.getCustomerPortalLink)

export default router