import { NotFoundError } from '@/utils/errors'

export default abstract class AbstractRepository {
  constructor () {
    if (this.constructor === AbstractRepository) throw new Error('Abstract class cannot be instantiated')
  }

  throwNotFoundError (message: string): never {
    if (message) throw new NotFoundError(message)
    else throw new NotFoundError()
  }
}