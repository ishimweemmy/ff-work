import express from 'express'
import { UserService } from '@/domains/users/service'
import { ObjectId } from '@/utils/abbreviations'
import z from 'zod'
import { UserFollowedByItselfError } from '@/utils/errors'

export async function getUser (req: express.Request, res: express.Response) {
  const userId = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new UserService(req.user!).getUser(userId)
  res.send({
    success: true,
    data: result,
  })
}

export async function getUserByUsername (req: express.Request, res: express.Response) {
  const username = z.string().nonempty().parse(req.params.username)
  const result = await new UserService(req.user!).getUserByUsername(username)
  res.send({
    success: true,
    data: result,
  })
}

export async function getFollowers (req: express.Request, res: express.Response) {
  const username = z.string().nonempty().parse(req.params.username)
  const result = await new UserService(req.user!).getUserByUsername(username)
  res.send({
    success: true,
    data: result?.followers
  })
}

export async function getFollowings (req: express.Request, res: express.Response) {
  const username = z.string().nonempty().parse(req.params.username)
  const result = await new UserService(req.user!).getUserByUsername(username)
  res.send({
    success: true,
    data: result.followings
  })
}

export async function getIsFollowing (req: express.Request, res: express.Response) {
  const username = z.string().nonempty().parse(req.params.username)
  const result = await new UserService(req.user!).getUserByUsername(username)
  const followers = result.followers
  const isFollowing = followers?.includes(req.user!._id)
  res.send({
    success: true,
    data: isFollowing
  })
}

export async function getUserLinks (req: express.Request, res: express.Response) {
  const username = z.string().nonempty().parse(req.params.username)
  const result = await new UserService(req.user!).getUserByUsername(username)
  res.send({
    success: true,
    data: result.links,
  }) 
}

export async function changeLinks (req: express.Request, res: express.Response) {
  const result = await new UserService(req.user!).changeLinks(req.body.data)
  res.send({
    data: result
  })
}

export async function changeProfilePhoto (req: express.Request, res: express.Response) {
  if (!req.file) {
    throw new Error('Missing file!')
  }
  const result = await new UserService(req.user!).changeProfilePhoto(req.file)
  res.send({
    success: true,
    data: result,
  })
}

export async function changeHeaderPhoto (req: express.Request, res: express.Response) {
  if (!req.file) {
    throw new Error('Missing file!')
  }
  const result = await new UserService(req.user!).changeHeaderPhoto(req.file)
  res.send({
    success: true,
    data: result,
  })
}

export async function addFollower(req: express.Request, res: express.Response) {
  const following = z.string().nonempty().parse(req.params.username)
  if (following === req.user?.username) throw new UserFollowedByItselfError()
  const result = await new UserService(req.user!).addFollower(following)
  res.send({
    success: true,
    data: result.followers
  })
}

export async function removeFollower(req: express.Request, res: express.Response) {
  const following = z.string().nonempty().parse(req.params.username)
  const result = await new UserService(req.user!).removeFollower(following)
  res.send({
    success: true,
    data: result?.followers
  })
}

export async function changeUsername (req: express.Request, res: express.Response) {
  const username = z.string().nonempty().parse(req.body.username)
  await new UserService(req.user!).changeUsername(username)
  res.send({
    success: true,
  })
}

export async function searchUsers (req: express.Request, res: express.Response) {
  const query = z.string().nonempty().parse(req.query.query)
  const result = await new UserService(req.user!).searchRedactedUsers({
    query
  })
  res.send({
    success: true,
    ...result
  })
}


export async function changePassword (req: express.Request, res: express.Response) {
  await new UserService(req.user!).changePassword({
    oldPassword: z.string().nonempty().optional().parse(req.body.oldPassword),
    newPassword: z.string().nonempty().parse(req.body.newPassword),
  })
  res.send({
    success: true,
  })
}

export async function changeEmail (req: express.Request, res: express.Response) {
  const email = z.string().nonempty().parse(req.body.email)
  const result = await new UserService(req.user!).changeEmail(email)
  res.send({
    success: true,
    data: result,
  })
}

export async function verifyEmail (req: express.Request, res: express.Response) {
  const code = z.string().nonempty().parse(req.body.code)
  const result = await new UserService(req.user!).verifyEmail(code)
  res.send({
    success: true,
    data: result,
  })
}

export async function getPayoutOnboardingLink(req: express.Request, res: express.Response) {
  const result = await new UserService(req.user!).getPayoutOnboardingLink({
    returnUrl: z.string().optional().parse(req.body.returnUrl)
  });
  res.send({
    success: true,
    data: result,
  })
}

export async function getPayoutDashboardLink(req: express.Request, res: express.Response) {
  const result = await new UserService(req.user!).getPayoutDashboardLink();
  res.send({
    success: true,
    data: result,
  })
}

export async function getPayoutOnboardingState(req: express.Request, res: express.Response) {
  const result = await new UserService(req.user!).getPayoutOnboardingState();
  res.send({
    success: true,
    data: result,
  })
}

export async function getCustomerPortalLink(req: express.Request, res: express.Response) {
  const result = await new UserService(req.user!).getCustomerPortalLink({
    returnUrl: z.string().optional().parse(req.body.returnUrl)
  });
  res.send({
    success: true,
    data: result,
  })
}