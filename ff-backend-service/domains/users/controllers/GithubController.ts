import User from '@/domains/users/models/UserModel'
import axios from 'axios'
import { Strategy, Profile } from 'passport-github2'
import signUp from '@/domains/users/services/signUp'
import UserRepository from '@/domains/users/repository'

const fetchUserEmail = async (accessToken: string, profile: Profile) => {
  if (profile.emails) {
    return profile.emails[0].value
  }
  const githubEmailApiRequest = await axios({
    url: 'https://api.github.com/user/emails',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  return githubEmailApiRequest.data[0].email
}

const githubStrategy = new Strategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/api/auth/github/callback',
}, async (accessToken: string, refreshToken: string, profile: Profile, verified: (err?: Error | null, user?: Express.User | null) => void) => {
  try {
    const primaryEmail = await fetchUserEmail(accessToken, profile)
    const [firstName, ...lastNameArr] = profile.displayName.split(' ')
    const lastName = lastNameArr.join(' ')
    const profilePhoto = profile.photos?.[0].value

    let user = await User.findOne({ email: primaryEmail })
    if (!user) {
      user = await signUp({
        username: profile.username,
        firstName,
        lastName,
        fullName: profile.displayName,
        email: primaryEmail,
        provider: 'github',
      })
      if (profilePhoto) await new UserRepository().changeUserPhotoToUrl(user, profilePhoto)
    }
    user.lastVisited = new Date()
    await user.save()
    verified(null, user)
  } catch (e) {
    if (e instanceof Error) return verified(e)
    return verified(new Error('Unspecified error.'))
  }
})

export default githubStrategy
