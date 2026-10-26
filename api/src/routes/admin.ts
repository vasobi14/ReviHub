import { Router } from 'express';
import z from 'zod';
import {
  authMiddleware,
  getAuthUser,
  requireAdmin,
} from '../middleware/auth.js';
import { adminService } from '../services/adminService.js';
import { analyticsService } from '../services/analyticsService.js';

const paramSchema = z.coerce.number().int().positive();

const feedQuerySchema = z.object({
  technical: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  userId: z.coerce.number().int().positive().optional(),
  before: z.coerce.number().int().positive().optional(),
});

const router = Router();

router.use(authMiddleware, requireAdmin);

// GET /admin/users
router.get('/users', async (_req, res) => {
  const users = await adminService.listUsers();
  res.json(users);
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const id = paramSchema.parse(req.params.id);
  await adminService.deleteUser(id, getAuthUser(req));
  res.status(204).send();
});

// GET /admin/analytics
router.get('/analytics', async (_req, res) => {
  res.json(await analyticsService.summary());
});

// GET /admin/analytics/feed?technical=&userId=&before=
router.get('/analytics/feed', async (req, res) => {
  const query = feedQuerySchema.parse(req.query);
  res.json(await analyticsService.feed(query));
});

// GET /admin/users/:id
router.get('/users/:id', async (req, res) => {
  const id = paramSchema.parse(req.params.id);
  res.json(await analyticsService.userSummary(id));
});

export default router;
