import webPushKey from './webPush'
import webPush from 'web-push'
import mongoose from 'mongoose'
import NotificationSubscription from '../../users/models/NotificationSubscriptionModel'
import express from 'express'

export async function getPublicSubscriptionKey (req: express.Request, res: express.Response) {
  res.send({
    success: true,
    data: webPushKey.publicKey
  })
}

export async function createNotificationSubscription (req: express.Request, res: express.Response) {
  const sessionId = req.session.id
  const userId = req.user!._id
  const subscription = req.body.subscription

  await NotificationSubscription.findOneAndUpdate({
    session: sessionId,
  }, {
    $set: {
      session: sessionId,
      subscription: {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      },
      user: userId,
    }
  }, {
    upsert: true,
  })
  webPush.sendNotification(subscription, JSON.stringify({
    body: 'Test',
    title: 'This is a notification',
  }))
  res.json({
    success: true
  })
}
