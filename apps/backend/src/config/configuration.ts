import { registerAs } from '@nestjs/config';
import type { Env } from './env.validation';

export default registerAs('app', () => {
  const env = process.env as unknown as Env;
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    database: { url: env.DATABASE_URL },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpires: env.JWT_ACCESS_EXPIRES,
      refreshExpiresDays: env.JWT_REFRESH_EXPIRES_DAYS,
    },
    redis: { url: env.REDIS_URL },
    google: { clientId: env.GOOGLE_CLIENT_ID },
    recaptcha: { secretKey: env.RECAPTCHA_SECRET_KEY },
    cors: { frontendUrl: env.FRONTEND_URL, adminUrl: env.ADMIN_URL },
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      fromName: env.SMTP_FROM_NAME,
      fromAddress: env.SMTP_FROM_ADDRESS,
    },
    vapid: {
      publicKey:    env.VAPID_PUBLIC_KEY,
      privateKey:   env.VAPID_PRIVATE_KEY,
      contactEmail: env.VAPID_CONTACT_EMAIL,
    },
    storage: {
      disk: env.DISK,
      localPath: env.STORAGE_LOCAL_PATH,
      url: env.STORAGE_URL,
      s3: {
        endpoint: env.S3_ENDPOINT,
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        key: env.S3_KEY,
        secret: env.S3_SECRET,
        publicUrl: env.S3_PUBLIC_URL,
      },
    },
  };
});
