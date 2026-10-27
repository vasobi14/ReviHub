import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED',
  });
};

export const demoLoginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,

  identifier: 'auth-demo',
  handler: rateLimitHandler,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  identifier: 'auth-login',
  handler: rateLimitHandler,
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,

  identifier: 'auth-register',
  handler: rateLimitHandler,
});

export const verifyEmailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  identifier: 'auth-verify-email',
  handler: rateLimitHandler,
});

export const resendVerificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  identifier: 'auth-resend-verification',
  handler: rateLimitHandler,
});
