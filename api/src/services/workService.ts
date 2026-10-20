import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config/env.js';
import type { Work as PrismaWork } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { WorkType } from '../types/work.types.js';
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
        logger.warn('Failed to delete work image file', error);
    }
}

export class WorkService {
    async assertOwnership(workId: number, userId: number) {
        const work = await prisma.work.findUnique({
            where: { id: workId },
        });
        if (!work) {
            throw new AppError(404, 'Work not found', 'NOT_FOUND');
        }
        if (work.createdById !== userId) {
            throw new AppError(
                403,
                'Not allowed to modify this work',
                'FORBIDDEN',
            );
        }
        return work;
    }

    async findMany(type?: WorkType, query?: string, page: number = 1) {
        const where: {
            type?: WorkType;
            title?: { contains: string; mode: 'insensitive' };
        } = {};

        if (type) {
            where.type = type;
        }

        if (query) {
            where.title = {
                contains: query,
                mode: 'insensitive',
            };
        }

        const skip = (page - 1) * config.pageSize;

        const [items, total] = await Promise.all([
            prisma.work.findMany({
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
            prisma.work.count({ where }),
        ]);

        const workIds = items.map((work) => work.id);

        const reviewStats = await prisma.review.groupBy({
            by: ['workId'],
            where: {
                workId: {
                    in: workIds,
                },
            },
            _avg: {
                score: true,
            },
            _count: {
                _all: true,
            },
        });

        const statsByWorkId = new Map(
            reviewStats.map((stat) => [stat.workId, stat]),
        );

        const result = items.map((work) => {
            const stats = statsByWorkId.get(work.id);
            return {
                id: work.id,
                title: work.title,
                type: work.type,
                releaseYear: work.releaseYear,
                description: work.description,

                averageRating: stats?._avg.score ?? null,
                reviewCount: stats?._count._all ?? 0,

                latestReviews: work.reviews,
                imageUrl: work.imageUrl,
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
        const work = await prisma.work.findUnique({
            where: { id },
        });

        if (!work) {
            throw new AppError(404, 'Work not found', 'NOT_FOUND');
        }

        const stats = await prisma.review.aggregate({
            where: { workId: id },
            _avg: { score: true },
            _count: { _all: true },
        });

        return {
            ...work,
            averageRating: stats._avg.score ?? null,
            reviewCount: stats._count._all,
        };
    }

    async create(
        data: {
            title: string;
            type: WorkType;
            releaseYear?: number;
            description?: string;
        },
        userId: number,
        imageUrl: string | null,
    ) {
        try {
            return await prisma.work.create({
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
            title: string;
            type: WorkType;
            releaseYear?: number;
            description?: string;
        },
        userId: number,
        imageUrl: string | null | undefined,
        removeImage: boolean,
    ) {
        const work = await this.assertOwnership(id, userId).catch(
            async (error) => {
                await cleanupImageFile(imageUrl ?? null);
                throw error;
            },
        );

        let newImageUrl = work.imageUrl;
        const oldImageUrl = work.imageUrl;

        if (removeImage) {
            newImageUrl = null;
        } else if (imageUrl !== undefined) {
            newImageUrl = imageUrl;
        }

        let updatedWork: PrismaWork;
        try {
            updatedWork = await prisma.work.update({
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

        return updatedWork;
    }

    async remove(id: number, userId: number) {
        const work = await this.assertOwnership(id, userId);
        const deletedWork = await prisma.work.delete({ where: { id } });
        await cleanupImageFile(work.imageUrl);
        return deletedWork;
    }
}

export const workService = new WorkService();
