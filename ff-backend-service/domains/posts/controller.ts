import express from 'express'
import PostService from './service'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'

export async function createPost (req: express.Request, res: express.Response) {
  const result = await new PostService(req.user!).createPost({
    title: z.string().nonempty().parse(req.body.title),
    content: z.string().nonempty().parse(req.body.content)
  })

  res.send({
    success: true,
    data: result
  })
}

export async function updatePost (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new PostService(req.user!).updatePost(
    id,
    {
      title: z.string().nonempty().parse(req.body.title),
      content: z.string().nonempty().parse(req.body.content)
    }
  )

  res.send({
    success: true,
    data: result
  })
}

export async function deletePost(req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new PostService(req.user!).deletePost(id)
  res.send({
    success: true
  })
}

export async function getPosts (req: express.Request, res: express.Response) {
  const result = await new PostService(req.user!).getPosts()
  res.send({
    success: true,
    data: result
  })
}

export async function getPost (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new PostService(req.user!).getPost(id)
  res.send({
    success: true,
    data: result
  })
}
