declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV?: string;
      MONGODB_URI: string;
      CORS_ORIGIN: string;
      VAPID_ORIGIN: string;
      ACCESS_KEY: string;
      SECRET_ACCESS_KEY: string;
      BUCKET_REGION: string;
      BUCKET_NAME: string;
      GITHUB_CLIENT_ID: string;
      GITHUB_CLIENT_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      SESSION_SECRET: string;
      ALGORITHM_SERVER_URL: string;
      ALGORITHM_AUTHORIZATION_KEY: string;
      STRIPE_KEY: string;
      STRIPE_ENDPOINT_SECRET: string;
      TESTING: string;
      TEST_USER_ID?: string;
      VAPID_PUBLIC_KEY: string;
      VAPID_PRIVATE_KEY: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      STRIPE_API_KEY: string;
      BILLING_MICROSERVICE_URL: string;
    }
  }
}

export {};
