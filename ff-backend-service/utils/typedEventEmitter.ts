import { EventEmitter } from 'events'

export default class TypedEventEmitter<T> extends EventEmitter {
  on (eventName: string | symbol, listener: (arg: T) => void): this {
    super.on(eventName, listener)
    return this
  }

  off (eventName: string | symbol, listener: (arg: T) => void): this {
    super.off(eventName, listener)
    return this
  }

  emit (eventName: string | symbol): boolean {
    return super.emit(eventName)
  }
}

