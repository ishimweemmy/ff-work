import notificationEventEmitter from './notificationEventEmitter'

export function createNotification (user: Express.User, notification: {body: string, title: string, url: string}) {
  notificationEventEmitter.emit('notificationCreated', {
    user,
    notification: {
      body: notification.body,
      title: notification.title,
      url: notification.url,
    }
  })
}
