// @ts-ignore
import webPush, { validateSubject } from 'web-push'
import dotenv from 'dotenv'

dotenv.config()

const webPushKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
}

webPush.setVapidDetails(
  process.env.VAPID_ORIGIN,
  webPushKeys.publicKey,
  webPushKeys.privateKey,
)

export default webPushKeys

