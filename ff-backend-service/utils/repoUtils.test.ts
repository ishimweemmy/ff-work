// import * as repoUtils from './repoUtils'
//
// describe('repoUtils', () => {
//   test('returns an array', () => {
//     const result = repoUtils.createCountPipeline({}, 'asset')
//     expect(Array.isArray(result)).toBe(true)
//   })
//
//   test('returns an array with two pipeline stages', () => {
//     const result = repoUtils.createCountPipeline({}, 'asset')
//     expect(result.length).toEqual(2)
//   })
//
//   test('first pipeline stage contains match operator with match stage', () => {
//     const matchStage = { dataset: "123" }
//     const result = repoUtils.createCountPipeline(matchStage, 'asset')
//     expect(result[0]).toEqual({ $match: matchStage })
//   })
//
//   test('second pipeline stage contains count operator with countName', () => {
//     const countName = 'asset'
//     const result = repoUtils.createCountPipeline({}, countName)
//     expect(result[1]).toEqual({ $count: countName })
//   })
// })
//
