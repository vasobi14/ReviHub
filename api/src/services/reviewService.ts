import config from '../config/env.js';
import type { User } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class ReviewService {
    async findForUser(workId: number, userId: number) {
        return prisma.review.findUnique({
            where: {
                workId_userId: { workId, userId },
            },
            include: {
                user: { select: { id: true, name: true } },
            },
        });
    }

    async findMany(workId?: number, page: number = 1, excludeUserId?: number) {
        const where: {
            workId?: number;
            userId?: { not: number };
        } = {};

        if (workId) {
            where.workId = workId;
        }

        if (excludeUserId) {
            where.userId = { not: excludeUserId };
        }

        const skip = (page - 1) * config.pageSize;

        const [items, total] = await Promise.all([
            prisma.review.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true } },
                    work: true,
                },
                skip,
                take: config.pageSize,
            }),
            prisma.review.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            pageSize: config.pageSize,
            totalPages: Math.ceil(total / config.pageSize),
        };
    }

    async findOne(id: number) {
        const review = await prisma.review.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true } } },
        });

        if (!review) {
            throw new AppError(404, 'Review not found', 'NOT_FOUND');
        }

        return review;
    }

    async create(
        workId: number,
        score: number,
        text: string | undefined,
        user: User,
    ) {
        const work = await prisma.work.findUnique({ where: { id: workId } });
        if (!work) {
            throw new AppError(404, 'Work not found', 'NOT_FOUND');
        }

        const existing = await prisma.review.findFirst({
            where: { workId, userId: user.id },
        });

        if (existing) {
            throw new AppError(400, 'You have already reviewed this work');
        }

        return prisma.review.create({
            data: {
                workId,
                userId: user.id,
                score,
                text,
            },
            include: {
                user: { select: { id: true, email: true, name: true } },
                work: true,
            },
        });
    }

    async update(
        id: number,
        score: number,
        text: string | undefined,
        userId: number,
    ) {
        const review = await this.findOne(id);

        if (!review.user || review.user.id !== userId) {
            throw new AppError(
                403,
                'Not allowed to update this review',
                'FORBIDDEN',
            );
        }

        return prisma.review.update({
            where: { id },
            data: { score, text },
            include: {
                user: { select: { id: true, email: true, name: true } },
            },
        });
    }

    async remove(id: number, userId: number) {
        const review = await this.findOne(id);

        if (!review.user || review.user.id !== userId) {
            throw new AppError(
                403,
                'Not allowed to delete this review',
                'FORBIDDEN',
            );
        }

        return prisma.review.delete({ where: { id } });
    }
}

export const reviewService = new ReviewService();
