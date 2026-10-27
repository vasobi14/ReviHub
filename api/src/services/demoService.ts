import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { deleteUserWithContent } from './adminService.js';

const DEMO_ACCOUNT_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function deleteOldDemoAccounts() {
  const users = await prisma.user.findMany({
    where: {
      role: 'DEMO',
      createdAt: {
        lt: new Date(Date.now() - DEMO_ACCOUNT_TTL_DAYS * DAY_MS),
      },
    },
    select: { id: true },
  });

  let deleted = 0;
  for (const { id } of users) {
    try {
      await deleteUserWithContent(id);
      deleted++;
    } catch (error) {
      logger.error(`Failed to delete demo account ${id}:`, error);
    }
  }
  if (deleted) logger.info(`Deleted ${deleted} demo accounts`);
}
