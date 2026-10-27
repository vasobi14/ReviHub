import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthUser } from '../types/user.types.js';
import { updateTitleStats } from './reviewService.js';
import { cleanupImageFile } from './titleService.js';

export class AdminService {
  async listUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { titles: true, reviews: true } },
      },
    });
  }

  async deleteUser(id: number, admin: AuthUser) {
    if (id === admin.id) {
      throw new AppError(
        400,
        'You cannot delete yourself',
        'CANNOT_DELETE_SELF',
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }
    if (user.role === 'ADMIN') {
      throw new AppError(403, 'Admins cannot be deleted', 'FORBIDDEN');
    }

    await deleteUserWithContent(id);
  }
}

export async function deleteUserWithContent(id: number) {
  const imageUrls = await prisma.$transaction(async (tx) => {
    const titles = await tx.title.findMany({
      where: { createdById: id },
      select: { id: true, imageUrl: true },
    });
    const titleIds = titles.map((title) => title.id);

    const reviewStats = await tx.review.groupBy({
      by: ['titleId'],
      where: { userId: id, titleId: { notIn: titleIds } },
      _sum: { score: true },
      _count: { _all: true },
    });
    for (const stat of reviewStats) {
      await updateTitleStats(
        tx,
        stat.titleId,
        -(stat._sum.score ?? 0),
        -stat._count._all,
      );
    }

    await tx.review.deleteMany({ where: { userId: id } });
    await tx.title.deleteMany({ where: { id: { in: titleIds } } });
    await tx.user.delete({ where: { id } });

    return titles.map((title) => title.imageUrl);
  });

  await Promise.all(imageUrls.map(cleanupImageFile));
}

export const adminService = new AdminService();
