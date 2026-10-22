import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../config/env.js';
import { authService } from '../services/authService.js';
import type { AuthUser } from '../types/user.types.js';
import { AppError } from './errorHandler.js';

export function getAuthUser(req: Request): AuthUser {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
    }
    return req.user;
}

function getUserIdFromToken(decoded: JwtPayload): number {
    if (typeof decoded.sub !== 'string') {
        throw new AppError(401, 'Invalid token structure', 'INVALID_TOKEN');
    }

    const userId = Number(decoded.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError(401, 'Invalid token structure', 'INVALID_TOKEN');
    }

    return userId;
}

export const authMiddleware = async (
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

        const userId = getUserIdFromToken(decoded);

        const user = await authService.getMe(userId);

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};
