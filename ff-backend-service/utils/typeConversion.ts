import mongoose from 'mongoose'

export function toNumber (number: any) {
  if (number === '') return NaN
  if ((number ?? undefined) === undefined) {
    return undefined
  } else {
    return +number
  }
}

export function toObjectId (item: any) {
  if (!mongoose.Types.ObjectId.isValid(item)) return undefined
  return new mongoose.Types.ObjectId(item)
}

export function stringToOptionalBoolean(data: any) {
  return data === 'true' ? true : data === 'false' ? false : undefined
}