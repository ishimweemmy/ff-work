import express from 'express'
import * as RecipeControllers from '@/domains/recipes/controllers'
import * as LabelControllers from '@/domains/labels/controllers'

import { checkAuthorized } from '@/middlewares/auth'

const router = express.Router();

router.use(checkAuthorized);
router.post("/", RecipeControllers.createRecipe);
router.get("/search", RecipeControllers.searchRecipes);
router.get("/:id", RecipeControllers.getRecipeById);
router.patch("/:id/rename", RecipeControllers.renameRecipe);
router.delete("/:id", RecipeControllers.deleteRecipe);
router.post("/:recipeId/labels", LabelControllers.createLabel);
router.get("/:recipeId/labels", LabelControllers.getLabelsByRecipeId);

export default router;

