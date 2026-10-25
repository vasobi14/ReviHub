import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config/env.js';
import type {
  Prisma,
  Title as PrismaTitle,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { isAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import type { TitleSort, TitleType } from '../types/title.types.js';
import type { AuthUser } from '../types/user.types.js';
import { logger } from '../utils/logger.js';

const uploadDir = config.uploadDir;

export const MIN_REVIEWS_FOR_TOP_RATED = 3;

export const TITLES_PAGE_SIZE = 12;

const ORDER_BY: Record<TitleSort, Prisma.TitleOrderByWithRelationInput[]> = {
  new: [{ createdAt: 'desc' }, { id: 'desc' }],
  year: [
    { releaseYear: { sort: 'desc', nulls: 'last' } },
    { createdAt: 'desc' },
    { id: 'desc' },
  ],
  popular: [{ reviewCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
  rating: [
    { averageRating: { sort: 'desc', nulls: 'last' } },
    { reviewCount: 'desc' },
    { id: 'desc' },
  ],
};

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

export async function cleanupImageFile(imageUrl: string | null) {
  try {
    await deleteImageFile(imageUrl);
  } catch (error) {
    logger.warn('Failed to delete title image file', error);
  }
}

export class TitleService {
  // The creator or an admin
  async assertCanModify(titleId: number, user: AuthUser) {
    const title = await prisma.title.findUnique({
      where: { id: titleId },
    });
    if (!title) {
      throw new AppError(404, 'Title not found', 'NOT_FOUND');
    }
    if (title.createdById !== user.id && !isAdmin(user)) {
      throw new AppError(403, 'Not allowed to modify this title', 'FORBIDDEN');
    }
    return title;
  }

  async findMany(
    type?: TitleType,
    query?: string,
    page: number = 1,
    sort: TitleSort = 'new',
  ) {
    const where: Prisma.TitleWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (query) {
      where.name = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (sort === 'rating') {
      where.reviewCount = { gte: MIN_REVIEWS_FOR_TOP_RATED };
    }

    const skip = (page - 1) * TITLES_PAGE_SIZE;

    const [items, total] = await Promise.all([
      prisma.title.findMany({
        where,
        orderBy: ORDER_BY[sort],
        select: {
          id: true,
          name: true,
          type: true,
          releaseYear: true,
          description: true,
          averageRating: true,
          reviewCount: true,
          imageUrl: true,
        },
        skip,
        take: TITLES_PAGE_SIZE,
      }),
      prisma.title.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize: TITLES_PAGE_SIZE,
      totalPages: Math.ceil(total / TITLES_PAGE_SIZE),
    };
  }

  async findOne(id: number) {
    const title = await prisma.title.findUnique({
      where: { id },
      omit: { ratingSum: true },
    });

    if (!title) {
      throw new AppError(404, 'Title not found', 'NOT_FOUND');
    }

    return title;
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
    user: AuthUser,
    imageUrl: string | null | undefined,
    removeImage: boolean,
  ) {
    const title = await this.assertCanModify(id, user).catch(async (error) => {
      await cleanupImageFile(imageUrl ?? null);
      throw error;
    });

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

    if (imageUrl && imageUrl !== newImageUrl) await cleanupImageFile(imageUrl);
    if (oldImageUrl && oldImageUrl !== newImageUrl)
      await cleanupImageFile(oldImageUrl);

    return updatedTitle;
  }

  async remove(id: number, user: AuthUser) {
    const title = await this.assertCanModify(id, user);
    const deletedTitle = await prisma.title.delete({ where: { id } });
    await cleanupImageFile(title.imageUrl);
    return deletedTitle;
  }
}

export const titleService = new TitleService();
