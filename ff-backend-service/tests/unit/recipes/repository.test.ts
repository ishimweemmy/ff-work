import { setup, teardown } from '@/tests/unit/base'
import Recipe, { IRecipe } from '@/domains/recipes/model'
import { ObjectId } from '@/utils/abbreviations'
import RecipeRepository from '@/domains/recipes/repository'
import { ImmutableResourceError, NotFoundError, UserMismatchError } from '@/utils/errors'
import { fakerEN } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'
import UserRepository from '@/domains/users/repository'
import UserModel, { IUser } from '@/domains/users/models/UserModel'
import userFixture from '@/tests/unit/users/fixture'

let recipeRepo = new RecipeRepository()

describe('recipeRepository', () => {
  let testUser: IUser
  let currentRecipeId: ObjectId
  beforeAll(async () => {
    await setup()
    testUser = (await userFixture())[0]
  })
  afterAll(async () => {
    await teardown()
  })
  test('Create a recipe', async () => {
    const newRecipe = await recipeRepo.createRecipe({
      user: testUser._id,
      name: 'Test recipe',
    })
    currentRecipeId = newRecipe._id
    expect(newRecipe._id).toBeInstanceOf(ObjectId)
    expect(newRecipe.name).toEqual('Test recipe')
  })
  test('Find a recipe', async () => {
    let recipe = await recipeRepo.getRecipeById(currentRecipeId)
    expect(recipe._id).toBeInstanceOf(ObjectId)
    expect(recipe.name).toEqual('Test recipe')
  })
  test('This recipe does not exist!', async () => {
    let promise = recipeRepo.getRecipeById(new ObjectId())
    await expect(promise).rejects.toBeInstanceOf(NotFoundError)
  })
  test('Random recipe creation', async () => {
    for (let i = 0; i < 300; i++) {
      const recipeFakeName = fakerEN.person.zodiacSign()
      await recipeRepo.createRecipe({
        user: testUser._id,
        name: `Recipe ${recipeFakeName} ${i}`,
      })
    }
  })
  test('Search for recipes', async () => {
    let nextId: string | undefined = undefined
    const matchedRecipes = await recipeRepo.searchRecipes({
      name: 'Pisces',
      user: testUser._id,
      pagination: {
        limit: Infinity,
      }
    })
    const matchedRecipeIds = matchedRecipes.data.map(recipe => recipe._id.toString())
    const paginatedMatchedRecipes: IRecipe[] = []
    do {
      const searchedRecipes = await recipeRepo.searchRecipes({
        name: 'Pisces',
        user: testUser._id,
        pagination: {
          next: nextId,
          limit: 5,
        }
      })
      paginatedMatchedRecipes.push(...searchedRecipes.data)
      nextId = searchedRecipes.meta.next
    } while (nextId)
    const paginatedMatchedRecipeIds = paginatedMatchedRecipes.map(recipe => recipe._id.toString())
    let passed = true
    for (let recipe of paginatedMatchedRecipes) {
      if (!recipe.name.includes('Pisces')) {
        passed = false
      }
    }
    expect(passed).toBeTruthy()
    expect(paginatedMatchedRecipeIds).toEqual(matchedRecipeIds)
    expect(paginatedMatchedRecipeIds.length).toEqual(matchedRecipeIds.length)
  })
  test('Rename a recipe', async () => {
    const recipe = await recipeRepo.getRecipeById(currentRecipeId)
    await recipeRepo.renameRecipe(recipe, 'Recipe with a new name')
    const editedRecipe = await recipeRepo.getRecipeById(currentRecipeId)
    expect(editedRecipe.name).toEqual('Recipe with a new name')
  })
  test('Valid ownership', async () => {
    const recipe = await recipeRepo.getRecipeById(currentRecipeId)
    recipeRepo.verifyRecipeOwner(recipe, testUser)
  })
  test('Invalid ownership', async () => {
    const recipe = await recipeRepo.getRecipeById(currentRecipeId)
    const user = await UserModel.findOne({
      _id: {
        $ne: testUser._id
      }
    })
    if (!user) {
      throw new Error('Test aborted - user not found.')
    }
    await expect(() => recipeRepo.verifyRecipeOwner(recipe, user)).toThrowError(UserMismatchError)
  })
  test('Delete a recipe', async () => {
    const recipe = await recipeRepo.getRecipeById(currentRecipeId)
    await recipeRepo.deleteRecipe(recipe)
    const promise = recipeRepo.getRecipeById(currentRecipeId)
    await expect(promise).rejects.toBeInstanceOf(NotFoundError)
  })
  test('Locked/immutable recipes cannot be deleted', async () => {
    const recipe = await Recipe.findOne({
      user: testUser._id,
    })
    if (!recipe) {
      throw new Error("Test aborted - recipe not found.");
    }
    await recipeRepo.lockRecipe(recipe)
    await expect(recipeRepo.deleteRecipe(recipe)).rejects.toBeInstanceOf(ImmutableResourceError)
  })
})