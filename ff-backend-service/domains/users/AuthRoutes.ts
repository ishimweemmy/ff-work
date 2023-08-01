import passport from 'passport'
import * as localAccountController from '@/domains/users/controllers/LocalController'
import * as accountController from '@/domains/users/controllers/AccountController'
import express from 'express'
import {
  acceptOAuthInstance,
  createOAuthInstance,
  privateGetOAuthInstance,
  publicGetOAuthInstance, rejectOAuthInstance
} from '@/domains/users/controllers/auth/DeviceAuthorizationController'
import { checkAuthorized } from '@/middlewares/auth'

const failureRedirect = '/api/auth/error'
const successRedirect = '/api/auth/success'

const router = express.Router()
router.get('/currentUser', accountController.getCurrentUser)

router.get('/success', accountController.successfulAuth)
router.get('/error', accountController.failedAuth)

router.post('/signup', localAccountController.signUp)
router.post('/login', localAccountController.signIn)

router.post('/waitlist', accountController.addEmailToBetaWaitlist)

router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}))
router.get('/github/callback', passport.authenticate('github', {
  failureRedirect: failureRedirect,
  successRedirect: successRedirect,
  failureFlash: false
}))

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}))
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: failureRedirect,
  successRedirect: successRedirect,
  failureFlash: false
}))

router.get('/logout', accountController.signOut)
router.get('/oauth/deviceAuthorization', createOAuthInstance)
router.post('/oauth/deviceAuthorization/accept', checkAuthorized, acceptOAuthInstance)
router.post('/oauth/deviceAuthorization/reject', checkAuthorized, rejectOAuthInstance)
router.post('/oauth/deviceAuthorization/private', privateGetOAuthInstance)
router.get('/oauth/deviceAuthorization/public', publicGetOAuthInstance)

export default router
