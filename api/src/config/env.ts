import path from 'node:path';
import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CORS_ORIGIN: z.string().optional(),
  UPLOAD_DIR: z.string().optional(),
  PAGE_SIZE: z.coerce.number().int().positive().default(6),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),
  ANALYTICS_KEY: z
    .preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .string()
        .regex(/^[0-9a-f]{64}$/i, 'ANALYTICS_KEY must be 64 hex characters')
        .optional(),
    ),
  DEMO_LOGIN_KEY: z
    .preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(32, 'DEMO_LOGIN_KEY must be at least 32 characters').optional(),
    ),
});

const env = envSchema.parse(process.env);

const config = {
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  nodeEnv: env.NODE_ENV,
  corsOrigins: env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'],
  uploadDir: path.resolve(
    env.UPLOAD_DIR ?? (env.NODE_ENV === 'test' ? 'uploads-test' : 'uploads'),
  ),
  pageSize: env.PAGE_SIZE,
  resendApiKey: env.RESEND_API_KEY,
  emailFrom: env.EMAIL_FROM,
  analyticsKey: env.ANALYTICS_KEY,
  demoLoginKey: env.DEMO_LOGIN_KEY,
};

export default config;
