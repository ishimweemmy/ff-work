import express from 'express'
import LabelServices from '@/domains/labels/services'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'
import { ANNOTATION_TOOL_ENUM } from '@/domains/labels/model'

export async function createLabel (req: express.Request, res: express.Response) {
  const recipeId = new ObjectId(z.string().nonempty().parse(req.params.recipeId))
  const result = await new LabelServices(req.user!).createLabel(recipeId, {
    name: z.string().nonempty().parse(req.body.name),
    tool: ANNOTATION_TOOL_ENUM.parse(req.body.tool),
    color: z.string().nonempty().regex(/^#([0-9a-f]{3}){1,2}$/i).parse(req.body.color),
  })
  res.json({
    success: true,
    data: result,
  })
}

export async function getLabelById (req: express.Request, res: express.Response) {
  const id = new ObjectId(req.params.id)
  const result = await new LabelServices(req.user!).getLabelById(id)
  res.json({
    success: true,
    data: result,
  })
}

export async function getLabelsByRecipeId (req: express.Request, res: express.Response) {
  const recipeId = new ObjectId(z.string().nonempty().parse(req.params.recipeId))
  const result = await new LabelServices(req.user!).getLabelsByRecipeId(recipeId)
  res.json({
    success: true,
    data: result,
  })
}

export async function deleteLabel (req: express.Request, res: express.Response) {
  const labelId = new ObjectId(z.string().parse(req.params.id))
  await new LabelServices(req.user!).deleteLabel(labelId)
  res.json({
    success: true,
  })
}

export async function renameLabel (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().parse(req.params.id))
  await new LabelServices(req.user!).renameLabel(id, z.string().parse(req.body.name))
  res.json({
    success: true,
  })
}

export async function changeToolOfLabel (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().parse(req.params.id))
  const tool = ANNOTATION_TOOL_ENUM.parse(req.body.tool)
  await new LabelServices(req.user!).changeToolOfLabel(id, tool)
  res.json({
    success: true,
  })
}

export async function changeColorOfLabel (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().parse(req.params.id))
  const newColor = z.string().regex(/^#([0-9a-f]{3}){1,2}$/i).parse(req.body.color);
  await new LabelServices(req.user!).changeColorOfLabel(id, newColor)
  res.json({
    success: true,
  })
}
