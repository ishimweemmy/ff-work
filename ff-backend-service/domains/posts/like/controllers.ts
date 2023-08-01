import express from 'express'
import PostLikeService from './service'
import { ObjectId } from '@/utils/abbreviations'
import { z } from 'zod'

export async function getLikeCountOfPost (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new PostLikeService(request.user!).getCount(id)
  response.send({ success: true, data: result })
}

export async function checkIfPostLiked (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new PostLikeService(request.user!).checkIfPostLiked(id)
  response.send({ success: true, data: result })
}

export async function likePost (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new PostLikeService(request.user!).likePost(id)
  response.send({ success: true, data: result })
}

export async function unlikePost (
  request: express.Request,
  response: express.Response
) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new PostLikeService(request.user!).unlikePost(id)
  response.send({ success: true, data: result })
}
