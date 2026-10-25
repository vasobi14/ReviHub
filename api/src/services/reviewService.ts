import config from '../config/env.js';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { isAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthUser } from '../types/user.types.js';

export async function updateTitleStats(
  tx: Prisma.TransactionClient,
  titleId: number,
  scoreDelta: number,
  countDelta: number,
) {
  const { ratingSum, reviewCount } = await tx.title.update({
    where: { id: titleId },
    data: {
      ratingSum: { increment: scoreDelta },
      reviewCount: { increment: countDelta },
    },
    select: { ratingSum: true, reviewCount: true },
  });

  await tx.title.update({
    where: { id: titleId },
    data: {
      averageRating: reviewCount > 0 ? ratingSum / reviewCount : null,
    },
  });
}

export class ReviewService {
  async findForUser(titleId: number, userId: number) {
    return prisma.review.findUnique({
      where: {
        titleId_userId: { titleId, userId },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async findMany(titleId?: number, page: number = 1, excludeUserId?: number) {
    const where: {
      titleId?: number;
      userId?: { not: number };
    } = {};

    if (titleId) {
      where.titleId = titleId;
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
    titleId: number,
    score: number,
    text: string | undefined,
    userId: number,
  ) {
    const title = await prisma.title.findUnique({ where: { id: titleId } });
    if (!title) {
      throw new AppError(404, 'Title not found', 'NOT_FOUND');
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: { titleId, userId, score, text },
          include: {
            user: { select: { id: true, name: true } },
          },
        });
        await updateTitleStats(tx, titleId, score, 1);
        return review;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(
          409,
          'You have already reviewed this title',
          'ALREADY_REVIEWED',
        );
      }
      throw error;
    }
  }

  async update(
    id: number,
    score: number,
    text: string | undefined,
    userId: number,
  ) {
    const review = await this.findOne(id);

    if (!review.user || review.user.id !== userId) {
      throw new AppError(403, 'Not allowed to update this review', 'FORBIDDEN');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: { score, text },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
      await updateTitleStats(tx, review.titleId, score - review.score, 0);
      return updated;
    });
  }

  // The author or an admin (moderation); editing stays author-only
  async remove(id: number, user: AuthUser) {
    const review = await this.findOne(id);

    if (review.user.id !== user.id && !isAdmin(user)) {
      throw new AppError(403, 'Not allowed to delete this review', 'FORBIDDEN');
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.review.delete({ where: { id } });
      await updateTitleStats(tx, review.titleId, -review.score, -1);
      return deleted;
    });
  }
}

export const reviewService = new ReviewService();
