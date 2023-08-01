import * as typeConversion from './typeConversion'
import mongoose from 'mongoose'

describe('toNumber', () => {
  test('returns undefined when number is undefined', () => {
    const result = typeConversion.toNumber(undefined)
    expect(result).toBe(undefined)
  })

  test('returns undefined when number is null', () => {
    const result = typeConversion.toNumber(null)
    expect(result).toBe(undefined)
  })

  test('returns number value when number is valid number', () => {
    const result = typeConversion.toNumber(42)
    expect(result).toBe(42)
  })

  test('returns the number value when number is a string representation of a number', () => {
    const result = typeConversion.toNumber('42')
    expect(result).toBe(42)
  })

  test('returns NaN when number is a non-numeric string', () => {
    const result = typeConversion.toNumber('abc')
    expect(result).toBeNaN()
  })

  test('returns NaN when number is an empty string', () => {
    const result = typeConversion.toNumber('')
    expect(result).toBeNaN()
  })
})

describe('toObjectID', () => {
  test('returns undefined when item is undefined', () => {
    expect(typeConversion.toObjectId(undefined)).toBe(undefined)
  })

  test('returns undefined when item is null', () => {
    expect(typeConversion.toObjectId(null)).toBe(undefined)
  })

  test('returns the ObjectId instance when item is a valid MongoDB ObjectId', () => {
    const objectId = new mongoose.Types.ObjectId();
    expect(typeConversion.toObjectId(objectId)).toBeInstanceOf(mongoose.Types.ObjectId)
  })

  test('returns the ObjectId instance when item is a string representation of a valid MongoDB ObjectId', () => {
    const objectIdString = new mongoose.Types.ObjectId().toHexString();
    expect(typeConversion.toObjectId(objectIdString)).toBeInstanceOf(mongoose.Types.ObjectId)
  })

  test('returns undefined when item is a non-ObjectId string', () => {
    const nonObjectIdString = 'abc'
    expect(typeConversion.toObjectId(nonObjectIdString)).toBe(undefined)
  })

  test('returns undefined when item is an empty string', () => {
    expect(typeConversion.toObjectId('')).toBe(undefined)
  })
})