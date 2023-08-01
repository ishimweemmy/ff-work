export default function cachedFixture<T> (callback: () => Promise<T>): () => Promise<T> {
  let executed = false
  let cached: T

  return async function () {
    if (executed) return cached
    cached = await callback()
    executed = true
    return cached
  }
}