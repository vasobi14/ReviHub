import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../config/env.js';
import { Role } from '../generated/prisma/client.js';
import type { AuthUser } from '../types/user.types.js';
import { AppError } from './errorHandler.js';

const ROLES: unknown[] = Object.values(Role);

export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  }
  return req.user;
}

export function isAdmin(user: AuthUser) {
  return user.role === 'ADMIN';
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!isAdmin(getAuthUser(req))) {
    throw new AppError(403, 'Admin access required', 'FORBIDDEN');
  }
  next();
}

function getUserFromToken(decoded: JwtPayload): AuthUser {
  const invalid = new AppError(401, 'Invalid token structure', 'INVALID_TOKEN');

  if (typeof decoded.sub !== 'string') {
    throw invalid;
  }

  const userId = Number(decoded.sub);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw invalid;
  }

  if (!ROLES.includes(decoded.role)) {
    throw invalid;
  }

  return { id: userId, role: decoded.role };
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(
        401,
        'Authorization header missing or malformed',
        'AUTH_HEADER_MISSING',
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    });

    if (typeof decoded === 'string') {
      throw new AppError(401, 'Invalid token structure', 'INVALID_TOKEN');
    }

    req.user = getUserFromToken(decoded);

    next();
  } catch (error) {
    next(error);
  }
};
