import { config } from 'dotenv';
import MongoStore from 'connect-mongo';
import { SessionOptions } from 'express-session';
import { CorsOptions } from 'cors';
import * as process from 'process'

console.log(process.env.NODE_ENV)
const envPath = process.env.NODE_ENV === 'test' ? './.env.test.local' : './.env'
config({
  path: envPath,
  debug: true
})

export const PORT = process.env.PORT;

export const MONGODB_URI = process.env.MONGODB_URI
console.log(process.env.MONGODB_URI)

export const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'flockfysh'

export const SESSION: SessionOptions = {
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    dbName: MONGO_DB_NAME,
    touchAfter: 24 * 3600,
    autoRemove: 'interval',
    autoRemoveInterval: 20,
  }),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 24 * 3600 * 1000 },
};

export const CORS_OPTIONS: CorsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

export const S3_CONFIG = {
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  region: 'nyc3',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
};

export const BUCKET_NAME: string = process.env.BUCKET_NAME;

export const BILLING_MICROSERVICE_URL: string = process.env.BILLING_MICROSERVICE_URL;

export const AWS_SDK_CREDENTIALS: {
  accessKeyId: string;
  secretAccessKey: string;
} = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
