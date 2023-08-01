import express from 'express'
import RecipeService from '@/domains/recipes/service'
import z from 'zod'
import { ObjectId } from '@/utils/abbreviations'

export async function createRecipe (req: express.Request, res: express.Response) {
  const result = await new RecipeService(req.user!).createRecipe({
    name: z.string().nonempty().parse(req.body.name),
  })
  res.json({
    success: true,
    data: result,
  })
}

export async function getRecipeById (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.id))
  const result = await new RecipeService(req.user!).getRecipeById(id, {
    expand: req.expand
  })
  res.json({
    success: true,
    data: result,
  })
}

export async function searchRecipes (req: express.Request, res: express.Response) {
  const result = await new RecipeService(req.user!).searchRecipes({
    name: z.string().optional().parse(req.query.name),
    expand: req.expand,
    pagination: req.pagination,
  })
  res.json({
    success: true,
    ...result,
  })
}

export async function deleteRecipe (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new RecipeService(req.user!).deleteRecipe(id)
  res.json({
    success: true,
  })
}

export async function renameRecipe (req: express.Request, res: express.Response) {
  const id = new ObjectId(z.string().nonempty().parse(req.params.id))
  await new RecipeService(req.user!).renameRecipe(id,
    z.string().nonempty().parse(req.body.name),
  )
  res.json({
    success: true,
  })
}
