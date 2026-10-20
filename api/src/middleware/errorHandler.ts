import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import z from 'zod';
import config from '../config/env.js';
import { Prisma } from '../generated/prisma/client.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
        public isOperational = true,
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const handleJwtError = (error: unknown, res: Response): void => {
    if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
            success: false,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED',
            expiresAt: error.expiredAt,
        });
        return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
        });
        return;
    }
};

export const handlePrismaError = (
    error: Prisma.PrismaClientKnownRequestError,
    res: Response,
): void => {
    if (error.code === 'P2002') {
        res.status(409).json({
            success: false,
            message: 'Resource already exists',
            code: 'CONFLICT',
        });
        return;
    }

    if (error.code === 'P2025') {
        res.status(404).json({
            success: false,
            message: 'Resource not found',
            code: 'NOT_FOUND',
        });
        return;
    }

    logger.error('Unknown Prisma error', {
        code: error.code,
        meta: error.meta,
    });

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
    });
    return;
};

export const handleZodError = (error: z.ZodError, res: Response): void => {
    const errors: Record<string, string> = {};

    error.issues.forEach((issue) => {
        errors[issue.path.join('.')] = issue.message;
    });

    res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
    });
};

export const errorHandler = (
    error: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    if (
        error instanceof SyntaxError &&
        'body' in error &&
        'status' in error &&
        (error as { status?: number }).status === 400
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON body',
            code: 'INVALID_JSON',
        });
    }
    if (error instanceof AppError) {
        const response: {
            success: boolean;
            message: string;
            code: string | undefined;
            errors?: Record<string, string>;
        } = {
            success: false,
            message: error.message,
            code: error.code,
        };

        return res.status(error.statusCode).json(response);
    }

    if (
        error instanceof jwt.TokenExpiredError ||
        error instanceof jwt.JsonWebTokenError
    ) {
        return handleJwtError(error, res);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(error, res);
    }

    if (error instanceof z.ZodError) {
        return handleZodError(error, res);
    }

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: 'File too large',
                code: 'FILE_TOO_LARGE',
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Invalid file upload',
            code: 'INVALID_FILE_UPLOAD',
        });
    }

    const isProduction = config.nodeEnv === 'production';

    logger.error('Unhandled error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
        success: false,
        message: isProduction ? 'Internal server error' : error.message,
        code: 'INTERNAL_ERROR',
    });
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND',
    });
};
