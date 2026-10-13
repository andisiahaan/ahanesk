import { z } from 'zod';

export const envSchema = z.object({
  // ─── App ──────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // ─── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url(),

  // ─── JWT ──────────────────────────────────────────────────────────────────
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),

  // ─── Redis ────────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url(),

  // ─── Google (opsional — kosong = Google Login tidak tersedia) ──────────────
  GOOGLE_CLIENT_ID: z.string().default(''),

  // ─── reCAPTCHA (opsional — kosong = captcha dinonaktifkan) ───────────────
  RECAPTCHA_SECRET_KEY: z.string().default(''),

  // ─── CORS ─────────────────────────────────────────────────────────────────
  FRONTEND_URL: z.string().url(),
  ADMIN_URL: z.string().url(),

  // ─── Email (SMTP) ─────────────────────────────────────────────────────────
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM_NAME: z.string().min(1),
  SMTP_FROM_ADDRESS: z.string().email(),

  // ─── Web Push (VAPID) ────────────────────────────────────────────────────────
  VAPID_PUBLIC_KEY:    z.string().min(1).optional(),
  VAPID_PRIVATE_KEY:   z.string().min(1).optional(),
  VAPID_CONTACT_EMAIL: z.string().email().optional(),

  // ─── Storage ──────────────────────────────────────────────────────────────
  DISK: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('../../storage'),
  STORAGE_URL: z.string().url().default('http://ahansk.test/storage'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_KEY: z.string().optional(),
  S3_SECRET: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Environment validation failed:\n${JSON.stringify(formatted, null, 2)}`);
  }

  const env = result.data;
  if (env.DISK === 's3') {
    if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_REGION || !env.S3_KEY || !env.S3_SECRET) {
      throw new Error('S3 configuration is incomplete. S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_KEY, S3_SECRET are required when DISK=s3');
    }
  }

  return env;
}
