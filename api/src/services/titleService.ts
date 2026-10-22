import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config/env.js';
import type { Title as PrismaTitle } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { TitleType } from '../types/title.types.js';
import { logger } from '../utils/logger.js';

const uploadDir = config.uploadDir;

async function deleteImageFile(imageUrl: string | null) {
    if (!imageUrl) return;

    const filename = path.basename(imageUrl);
    const filePath = path.join(uploadDir, filename);

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
}

async function cleanupImageFile(imageUrl: string | null) {
    try {
        await deleteImageFile(imageUrl);
    } catch (error) {
        logger.warn('Failed to delete title image file', error);
    }
}

export class TitleService {
    async assertOwnership(titleId: number, userId: number) {
        const title = await prisma.title.findUnique({
            where: { id: titleId },
        });
        if (!title) {
            throw new AppError(404, 'Title not found', 'NOT_FOUND');
        }
        if (title.createdById !== userId) {
            throw new AppError(
                403,
                'Not allowed to modify this title',
                'FORBIDDEN',
            );
        }
        return title;
    }

    async findMany(type?: TitleType, query?: string, page: number = 1) {
        const where: {
            type?: TitleType;
            name?: { contains: string; mode: 'insensitive' };
        } = {};

        if (type) {
            where.type = type;
        }

        if (query) {
            where.name = {
                contains: query,
                mode: 'insensitive',
            };
        }

        const skip = (page - 1) * config.pageSize;

        const [items, total] = await Promise.all([
            prisma.title.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    reviews: {
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: 3,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                skip,
                take: config.pageSize,
            }),
            prisma.title.count({ where }),
        ]);

        const titleIds = items.map((title) => title.id);

        const reviewStats = await prisma.review.groupBy({
            by: ['titleId'],
            where: {
                titleId: {
                    in: titleIds,
                },
            },
            _avg: {
                score: true,
            },
            _count: {
                _all: true,
            },
        });

        const statsByTitleId = new Map(
            reviewStats.map((stat) => [stat.titleId, stat]),
        );

        const result = items.map((title) => {
            const stats = statsByTitleId.get(title.id);
            return {
                id: title.id,
                name: title.name,
                type: title.type,
                releaseYear: title.releaseYear,
                description: title.description,

                averageRating: stats?._avg.score ?? null,
                reviewCount: stats?._count._all ?? 0,

                latestReviews: title.reviews,
                imageUrl: title.imageUrl,
            };
        });

        return {
            items: result,
            total,
            page,
            pageSize: config.pageSize,
            totalPages: Math.ceil(total / config.pageSize),
        };
    }

    async findOne(id: number) {
        const title = await prisma.title.findUnique({
            where: { id },
        });

        if (!title) {
            throw new AppError(404, 'Title not found', 'NOT_FOUND');
        }

        const stats = await prisma.review.aggregate({
            where: { titleId: id },
            _avg: { score: true },
            _count: { _all: true },
        });

        return {
            ...title,
            averageRating: stats._avg.score ?? null,
            reviewCount: stats._count._all,
        };
    }

    async create(
        data: {
            name: string;
            type: TitleType;
            releaseYear?: number;
            description?: string;
        },
        userId: number,
        imageUrl: string | null,
    ) {
        try {
            return await prisma.title.create({
                data: {
                    ...data,
                    createdById: userId,
                    imageUrl,
                },
            });
        } catch (error) {
            await cleanupImageFile(imageUrl);
            throw error;
        }
    }

    async update(
        id: number,
        data: {
            name: string;
            type: TitleType;
            releaseYear?: number;
            description?: string;
        },
        userId: number,
        imageUrl: string | null | undefined,
        removeImage: boolean,
    ) {
        const title = await this.assertOwnership(id, userId).catch(
            async (error) => {
                await cleanupImageFile(imageUrl ?? null);
                throw error;
            },
        );

        let newImageUrl = title.imageUrl;
        const oldImageUrl = title.imageUrl;

        if (removeImage) {
            newImageUrl = null;
        } else if (imageUrl !== undefined) {
            newImageUrl = imageUrl;
        }

        let updatedTitle: PrismaTitle;
        try {
            updatedTitle = await prisma.title.update({
                where: { id },
                data: {
                    ...data,
                    imageUrl: newImageUrl,
                },
            });
        } catch (error) {
            await cleanupImageFile(imageUrl ?? null);
            throw error;
        }

        if (imageUrl && imageUrl !== newImageUrl)
            await cleanupImageFile(imageUrl);
        if (oldImageUrl && oldImageUrl !== newImageUrl)
            await cleanupImageFile(oldImageUrl);

        return updatedTitle;
    }

    async remove(id: number, userId: number) {
        const title = await this.assertOwnership(id, userId);
        const deletedTitle = await prisma.title.delete({ where: { id } });
        await cleanupImageFile(title.imageUrl);
        return deletedTitle;
    }
}

export const titleService = new TitleService();
