import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3001),
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
    FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
});

const env = envSchema.parse(process.env);

const config = {
    port: env.PORT,
    jwtSecret: env.JWT_SECRET,
    nodeEnv: env.NODE_ENV,
    corsOrigins: env.CORS_ORIGIN
        ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : ['http://localhost:3000'],
    uploadDir: path.resolve(
        env.UPLOAD_DIR ??
            (env.NODE_ENV === 'test' ? 'uploads-test' : 'uploads'),
    ),
    pageSize: env.PAGE_SIZE,
    resendApiKey: env.RESEND_API_KEY,
    emailFrom: env.EMAIL_FROM,
    frontendUrl: env.FRONTEND_URL,
};

export default config;
