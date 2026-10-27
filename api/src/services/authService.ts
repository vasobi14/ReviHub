import crypto from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { Prisma, type User } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthUser } from '../types/user.types.js';
import { logger } from '../utils/logger.js';
import { sendVerificationEmail } from './emailService.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFICATION_ATTEMPTS = 5;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', 10);

function generateVerificationCode(): string {
  if (config.nodeEnv === 'test') return '123456';
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, '0');
}

export class AuthService {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(email: string, passwordHash: string, name?: string) {
    const cleanName = name?.trim() || null;
    return prisma.user.create({
      data: { email, passwordHash, name: cleanName },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return null;
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return null;

    return user;
  }

  async register(email: string, password: string, name?: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    let user: User;
    try {
      user = await this.createUser(email, passwordHash, name);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(409, 'Email already in use', 'EMAIL_EXISTS');
      }
      throw error;
    }

    const code = generateVerificationCode();
    await this.saveVerificationCode(user.id, code);

    try {
      await sendVerificationEmail(email, code);
    } catch (err) {
      logger.error('Failed to send verification email on register', {
        err,
        userId: user.id,
      });
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new AppError(
        403,
        'Email not verified. Please verify your email to log in.',
        'EMAIL_NOT_VERIFIED',
      );
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // A new throwaway account for every visit through the demo link
  async loginDemo(key: string) {
    if (!config.demoLoginKey) {
      throw new AppError(404, 'Demo login is off', 'NOT_FOUND');
    }
    const digest = (value: string) =>
      crypto.createHash('sha256').update(value).digest();
    if (!crypto.timingSafeEqual(digest(key), digest(config.demoLoginKey))) {
      throw new AppError(403, 'Invalid demo link', 'INVALID_DEMO_KEY');
    }

    const user = await prisma.user.create({
      data: {
        email: `demo-${crypto.randomBytes(6).toString('hex')}@demo.invalid`,
        name: 'Demo visitor',
        passwordHash: await bcrypt.hash(
          crypto.randomBytes(32).toString('hex'),
          10,
        ),
        emailVerified: true,
        role: 'DEMO',
      },
    });

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: await this.createRefreshToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // The role travels in the token, so a role change or a deleted account
  // takes effect when the token expires (ACCESS_TOKEN_TTL)
  private signAccessToken(user: AuthUser): string {
    return jwt.sign(
      { sub: String(user.id), role: user.role },
      config.jwtSecret,
      { expiresIn: ACCESS_TOKEN_TTL },
    );
  }

  private async createRefreshToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return token;
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const invalidToken = new AppError(
      401,
      'Invalid or expired refresh token',
      'INVALID_REFRESH_TOKEN',
    );

    if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
      throw invalidToken;
    }

    const { count } = await prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) {
      throw invalidToken;
    }

    const accessToken = this.signAccessToken(stored.user);
    const newRefreshToken = await this.createRefreshToken(stored.userId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: stored.user.id,
        email: stored.user.email,
        name: stored.user.name,
        role: stored.user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async saveVerificationCode(userId: number, code: string) {
    const codeHash = hashToken(code);
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationCodeHash: codeHash,
        verificationExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
        verificationAttempts: 0,
      },
    });
  }

  async verifyEmail(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(400, 'Invalid code', 'INVALID_CODE');
    }

    if (user.emailVerified) {
      return;
    }

    if (
      !user.verificationCodeHash ||
      !user.verificationExpiresAt ||
      user.verificationExpiresAt < new Date()
    ) {
      throw new AppError(400, 'Code expired or not requested', 'CODE_EXPIRED');
    }

    if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      throw new AppError(
        429,
        'Too many attempts. Request a new code.',
        'TOO_MANY_ATTEMPTS',
      );
    }

    const providedHash = hashToken(code);

    const expected = Buffer.from(user.verificationCodeHash, 'hex');
    const provided = Buffer.from(providedHash, 'hex');

    const matches = crypto.timingSafeEqual(expected, provided);

    if (!matches) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationAttempts: { increment: 1 } },
      });
      throw new AppError(400, 'Invalid code', 'INVALID_CODE');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCodeHash: null,
        verificationExpiresAt: null,
        verificationAttempts: 0,
      },
    });
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
      return;
    }

    const code = generateVerificationCode();
    await this.saveVerificationCode(user.id, code);

    try {
      await sendVerificationEmail(email, code);
    } catch (err) {
      logger.error('Failed to resend verification email', {
        err,
        userId: user.id,
      });
      throw new AppError(
        500,
        'Failed to send email. Try again later.',
        'EMAIL_SEND_FAILED',
      );
    }
  }

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      throw new AppError(401, 'User no longer exists', 'USER_NOT_FOUND');
    }
    return user;
  }
}

export const authService = new AuthService();
