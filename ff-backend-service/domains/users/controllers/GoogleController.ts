import User from '@/domains/users/models/UserModel'
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20'
import signUp from '@/domains/users/services/signUp'
import UserRepository from '@/domains/users/repository'

const googleStrategy = new Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken: string, refreshToken: string, profile: Profile, cb: VerifyCallback) => {
    try {
      const email = profile.emails?.[0].value
      const firstName = profile.name?.givenName
      const lastName = profile.name?.familyName
      const profilePhoto = profile.photos?.[0].value
      const provider = 'google'
      let user = await User.findOne({ email })
      if (!user) {
        user = await signUp({
          email,
          firstName,
          lastName,
          provider,
          fullName: profile.displayName,
        })
        if (profilePhoto) await new UserRepository().changeUserPhotoToUrl(user, profilePhoto);
      }
      user.lastVisited = new Date()
      await user.save()
      return cb(null, user)
    } catch (e) {
      if (e instanceof Error) return cb(e)
      return cb(new Error('Unspecified error.'))
    }
  }
)

export default googleStrategy
