import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import type { RequestHandler } from 'express';
import multer from 'multer';
import config from '../config/env.js';
import { AppError } from './errorHandler.js';

const uploadDir = config.uploadDir;

const allowedMimeTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
} as const;

async function detectImageMimeType(filePath: string) {
    const file = await fs.open(filePath, 'r');
    const signature = Buffer.alloc(12);

    try {
        await file.read(signature, 0, signature.length, 0);
    } finally {
        await file.close();
    }

    if (
        signature
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
        return 'image/png';
    }
    if (
        signature[0] === 0xff &&
        signature[1] === 0xd8 &&
        signature[2] === 0xff
    ) {
        return 'image/jpeg';
    }
    if (
        signature.toString('ascii', 0, 4) === 'RIFF' &&
        signature.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return 'image/webp';
    }

    return undefined;
}

export const validateImageContent: RequestHandler = async (req, _res, next) => {
    const file = req.file;
    if (!file) return next();

    try {
        const detectedMimeType = await detectImageMimeType(file.path);
        if (detectedMimeType !== file.mimetype) {
            throw new AppError(
                400,
                'Image content does not match its file type',
                'INVALID_IMAGE_TYPE',
            );
        }
        next();
    } catch (error) {
        await removeUploadedFile(file);
        next(error);
    }
};

export async function removeUploadedFile(file?: Express.Multer.File) {
    if (!file) return;
    await fs.unlink(file.path).catch(() => undefined);
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },

    filename: (_req, file, cb) => {
        const extension =
            allowedMimeTypes[file.mimetype as keyof typeof allowedMimeTypes];

        cb(null, `${crypto.randomUUID()}${extension}`);
    },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (!allowedMimeTypes[file.mimetype as keyof typeof allowedMimeTypes]) {
        cb(
            new AppError(
                400,
                'Only JPEG, PNG and WebP images are allowed',
                'INVALID_IMAGE_TYPE',
            ),
        );
        return;
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter,
});
