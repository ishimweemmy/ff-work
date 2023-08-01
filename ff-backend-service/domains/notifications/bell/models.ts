import mongoose from "mongoose";

export interface INotificationSubscription {
  lastSent?: Date;
  user: mongoose.Types.ObjectId;
}

const NotificationSchema =
  new mongoose.Schema<INotificationSubscription>({
    lastSent: {
        type: Date,
        default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  });

const Notification = mongoose.model<INotificationSubscription>(
  "notification",
  NotificationSchema
);

export default Notification;
