import mongoose from 'mongoose'

export interface INotificationSubscription {
  subscription: {
    endpoint: string,
    expirationTime: number,
    keys: {
      p256dh: string,
      auth: string,
    }
  },
  session: string,
  user: mongoose.Types.ObjectId,
}

const NotificationSubscriptionSchema = new mongoose.Schema<INotificationSubscription>({
  subscription: {
    type: {
      endpoint: {
        type: String,
        required: true,
      },
      expirationTime: {
        type: Number,
        required: false,
      },
      keys: {
        type: {
          p256dh: {
            required: true,
            type: String,
          },
          auth: {
            required: true,
            type: String,
          }
        },
        required: true,
      },
    },
    required: true,
  },
  session: {
    type: String,
    ref: 'Session',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
})

const NotificationSubscription = mongoose.model<INotificationSubscription>('NotificationSubscription', NotificationSubscriptionSchema)

export default NotificationSubscription
