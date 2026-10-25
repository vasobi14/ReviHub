import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /health
router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'ok',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'error',
    });
  }
});

export default router;
