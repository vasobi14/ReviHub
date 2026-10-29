import { type Request, Router } from 'express';
import z from 'zod';
import config from '../config/env.js';
import { authMiddleware, getAuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  demoLoginRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  resendVerificationRateLimiter,
  verifyEmailRateLimiter,
} from '../middleware/rateLimit.js';
import { authService } from '../services/authService.js';

const registerSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((value) => Buffer.byteLength(value) <= 72, 'Password is too long'),
  name: z.string().max(50, 'Name must be at most 50 characters').optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

const verifyEmailSchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

const resendVerificationSchema = z.object({
  email: z.email(),
});

const demoSchema = z.object({
  key: z.string().min(1).max(200),
});

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

const router = Router();

// POST /auth/register
router.post('/register', registerRateLimiter, async (req, res) => {
  const { email, password, name } = registerSchema.parse(req.body);
  const result = await authService.register(email, password, name);
  res.locals.userId = result.id;
  res.status(201).json(result);
});

// POST /auth/login
router.post('/login', loginRateLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.login(
    email,
    password,
  );

  res.locals.userId = user.id;
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ accessToken, user });
});

// POST /auth/demo
router.post('/demo', demoLoginRateLimiter, async (req, res) => {
  const { key } = demoSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.loginDemo(key);

  res.locals.userId = user.id;
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({ accessToken, user });
});

// POST /auth/verify-email
router.post('/verify-email', verifyEmailRateLimiter, async (req, res) => {
  const { email, code } = verifyEmailSchema.parse(req.body);
  await authService.verifyEmail(email, code);
  res.json({ success: true });
});

// POST /auth/resend-verification
router.post(
  '/resend-verification',
  resendVerificationRateLimiter,
  async (req, res) => {
    const { email } = resendVerificationSchema.parse(req.body);
    await authService.resendVerification(email);
    res.json({ success: true });
  },
);

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw new AppError(401, 'No refresh token', 'NO_REFRESH_TOKEN');
  }

  try {
    const {
      accessToken,
      refreshToken: newRefresh,
      user,
    } = await authService.refresh(refreshToken);

    res.cookie(REFRESH_COOKIE_NAME, newRefresh, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken, user });
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    throw error;
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
  res.status(204).send();
});

// GET /auth/me (protected)
router.get('/me', authMiddleware, async (req: Request, res) => {
  const { id } = getAuthUser(req);
  const user = await authService.getMe(id);
  res.json(user);
});

export default router;
