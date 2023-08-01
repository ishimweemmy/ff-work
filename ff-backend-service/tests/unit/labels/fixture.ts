import cachedFixture from '@/tests/unit/fixture'
import { fakerEN } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'
import recipeFixture from '@/tests/unit/recipes/fixture'
import { ANNOTATION_TOOL_ENUM, ILabel } from '@/domains/labels/model'
import LabelRepository from '@/domains/labels/repository'

async function _labelFixture (): Promise<HydratedDocument<ILabel>[]> {
  const testRecipes = await recipeFixture()
  const labels: HydratedDocument<ILabel>[] = []
  const labelNames = new Set<string>()
  for (let i = 0; i < 20; i++) {
    labelNames.add(fakerEN.animal.dog())
  }
  let j = 0;
  for (let name of labelNames) {
    labels.push(await new LabelRepository().createLabel(testRecipes[0], {
      name: name,
      color: fakerEN.color.rgb(),
      tool: ANNOTATION_TOOL_ENUM._def.values[j % ANNOTATION_TOOL_ENUM._def.values.length],
    }))
    labels.push(await new LabelRepository().createLabel(testRecipes[1], {
      name: name,
      color: fakerEN.color.rgb(),
      tool: ANNOTATION_TOOL_ENUM._def.values[j % ANNOTATION_TOOL_ENUM._def.values.length],
    }))
    j++;
  }
  return labels
}

const labelFixture = cachedFixture(_labelFixture)
export default labelFixture