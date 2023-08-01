import { EventEmitter } from 'events'
class NotificationEventEmitter extends EventEmitter {}

const notificationEventEmitter = new NotificationEventEmitter()

export default notificationEventEmitter