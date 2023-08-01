import AnnotationService from './service'
import express from 'express'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'

export async function getAnnotationById (request: express.Request<{
  id: string
}>, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  const result = await new AnnotationService(request.user!).getAnnotationById(id)
  response.json({
    success: true,
    data: result,
  })
}

export async function clearAnnotationsByAssetId (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.assetId))
  const result = await new AnnotationService(request.user!).clearAnnotationsByAssetId(id)
  response.json({
    success: true,
    data: result,
  })
}

export async function getAnnotationsByAssetId (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.assetId))
  const result = await new AnnotationService(request.user!).getAnnotationsByAssetId(id)
  response.json({
    success: true,
    data: result,
  })
}

export async function addAnnotation (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.body.assetId))
  const annotationData = {
    label: new ObjectId(z.string().nonempty().parse(request.body.label)),
    frame: z.number().int().nonnegative().optional().parse(request.body.frame),
    data: request.body.data,
    asset: new ObjectId(z.string().nonempty().parse(request.body.assetId)),
  }
  const result = await new AnnotationService(request.user!).addAnnotation(id, annotationData)
  response.json({
    success: true,
    data: result,
  })
}

export async function editAnnotation (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  await new AnnotationService(request.user!).editAnnotation(id, request.body)
  response.json({
    success: true,
  })
}

export async function removeAnnotationBox (request: express.Request, response: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(request.params.id))
  await new AnnotationService(request.user!).removeAnnotation(id)
  response.json({
    success: true,
  })
}
