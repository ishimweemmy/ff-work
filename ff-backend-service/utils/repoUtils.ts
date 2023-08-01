import mongoose, { HydratedDocument } from 'mongoose'
import { ObjectId } from '@/utils/abbreviations'
import * as console from 'console'
import Asset from '@/domains/assets/model'

// TODO: Unit testing!
export function _createMapping<Foreign> (parameters: {
  foreignCollection: Foreign[],
  foreignKey: keyof Foreign,
}) {
  const mapping: Record<string, Foreign> = {}
  for (let foreignItem of parameters.foreignCollection) {
    const foreignId = foreignItem[parameters.foreignKey] as unknown
    if (typeof foreignId !== 'string' && !(foreignId instanceof ObjectId)) {
      throw new Error(`Foreign key ${foreignId} is not a String or an ObjectId.`)
    }
    mapping[foreignId.toString()] = foreignItem
  }
  return mapping
}

export function expandCollectionAndMergeFields<Local extends {}, Foreign extends {}> (parameters: {
  localCollection: Local[],
  foreignCollection: Foreign[],
  localKey: keyof Local,
  foreignKey: keyof Foreign,
}): (Local & Foreign)[] {
  const mapping = _createMapping<Foreign>({
    foreignCollection: parameters.foreignCollection, foreignKey: parameters.foreignKey,
  })
  return parameters.localCollection.map((item: Local | HydratedDocument<Local>) => {
    if (typeof (item as HydratedDocument<Local>).toObject === 'function') {
      item = (item as HydratedDocument<Local>).toObject({ virtuals: true })
    }
    const localId = item[parameters.localKey] as unknown
    if (typeof localId !== 'string' && !(localId instanceof ObjectId)) {
      throw new Error(`Foreign key ${localId} is not a String or an ObjectId.`)
    }
    const foreignItem = mapping[localId.toString()]
    if (!foreignItem) {
      throw new Error(`Cannot find foreign object binding to the local key ${localId}`)
    }
    const processedForeignItem = {
      ...foreignItem,
    }
    delete processedForeignItem[parameters.foreignKey]
    return {
      ...item,
      ...processedForeignItem,
    } as (Local & Foreign)
  })
}

export function expandCollectionIntoOneField<Local extends {}, Foreign extends {}, TargetField extends string> (parameters: {
  localCollection: Local[],
  foreignCollection: Foreign[],
  localKey: keyof Local,
  foreignKey: keyof Foreign,
  path: TargetField,
}): (Local & {
  [type in TargetField]: Foreign
})[] {
  if (typeof parameters.path as unknown !== 'string') {
    throw new Error('Target field must be a string.')
  }
  const mapping = _createMapping<Foreign>({
    foreignCollection: parameters.foreignCollection, foreignKey: parameters.foreignKey,
  })
  return parameters.localCollection.map((item: Local | HydratedDocument<Local>) => {
    if (typeof (item as HydratedDocument<Local>).toObject === 'function') {
      item = (item as HydratedDocument<Local>).toObject({ virtuals: true })
    }
    const localId = item[parameters.localKey] as unknown
    if (typeof localId !== 'string' && !(localId instanceof ObjectId)) {
      throw new Error(`Local key ${localId} is not a String or an ObjectId.`)
    }
    const foreignItem = mapping[localId.toString()]
    if (!foreignItem) {
      throw new Error(`Cannot find foreign object binding to the local key ${localId}`)
    }
    return {
      ...item,
      [parameters.path]: foreignItem,
    } as (Local & {
      [type in TargetField]: Foreign
    })
  })
}

export function expandCollectionIntoOneFieldWithOneField<Local extends {}, Foreign extends {}, TargetField extends string, ExtractField extends keyof Foreign> (parameters: {
  localCollection: Local[],
  foreignCollection: Foreign[],
  localKey: keyof Local,
  foreignKey: keyof Foreign,
  path: TargetField,
  extractPath: ExtractField
}) {
  if (typeof parameters.path as unknown !== 'string') {
    throw new Error('Target field must be a string.')
  }
  const mapping = _createMapping<Foreign>({
    foreignCollection: parameters.foreignCollection, foreignKey: parameters.foreignKey,
  })
  return parameters.localCollection.map((item: Local | HydratedDocument<Local>) => {
    if (typeof (item as HydratedDocument<Local>).toObject === 'function') {
      item = (item as HydratedDocument<Local>).toObject({ virtuals: true })
    }
    const localId = item[parameters.localKey] as unknown
    if (typeof localId !== 'string' && !(localId instanceof ObjectId)) {
      throw new Error(`Local key ${localId} is not a String or an ObjectId.`)
    }
    const foreignItem = mapping[localId.toString()]
    if (!foreignItem) {
      throw new Error(`Cannot find foreign object binding to the local key ${localId}`)
    }
    const value: Foreign[typeof parameters.extractPath] = foreignItem[parameters.extractPath]
    return {
      ...item,
      [parameters.path]: value,
    }
  })
}