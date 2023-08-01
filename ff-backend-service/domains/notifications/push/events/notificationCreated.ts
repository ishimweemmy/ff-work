import notificationEventEmitter from '../notificationEventEmitter';
import NotificationSubscription from '../../../users/models/NotificationSubscriptionModel';
import mongoose from 'mongoose';
import '../../../users/models/SessionModel';
import webPush from 'web-push';

notificationEventEmitter.on(
  'notificationCreated',
  async function ({
    user,
    notification,
  }: {
    user: Express.User;
    notification: { title: string; body: string };
  }) {
    const allSubscriptions = await NotificationSubscription.find({
      user: user._id,
    }).populate('session');
    const payload = {
      title: notification.title,
      body: notification.body,
    };
    const jsonPayload = JSON.stringify(payload);
    for (let subscription of allSubscriptions) {
      if (!subscription.session) {
        subscription.delete();
        console.log('Subscription deleted.');
        continue;
      }
      try {
        await webPush.sendNotification(subscription.subscription, jsonPayload);
      } catch (e) {
        console.error(e);
        subscription.delete();
      }
    }
  }
);
