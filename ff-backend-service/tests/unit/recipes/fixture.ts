import userFixture from '@/tests/unit/users/fixture'
import { IRecipe } from '@/domains/recipes/model'
import cachedFixture from '@/tests/unit/fixture'
import RecipeRepository from '@/domains/recipes/repository'
import { fakerEN } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

async function _recipeFixture (): Promise<HydratedDocument<IRecipe>[]> {
  const testUser = (await userFixture())[0];
  const recipes: HydratedDocument<IRecipe>[] = [];
  for (let i = 0; i < 20; i++) {
    recipes.push(await new RecipeRepository().createRecipe({
      user: testUser._id,
      name: fakerEN.person.zodiacSign(),
    }));
  }
  return recipes;
}

const recipeFixture = cachedFixture(_recipeFixture);
export default recipeFixture