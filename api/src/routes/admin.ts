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
router.get('/analytics', async (req, res) => {
  const { technical } = feedQuerySchema.parse(req.query);
  res.json(await analyticsService.summary(technical));
});

// GET /admin/users/:id/activity
router.get('/users/:id/activity', async (req, res) => {
  const id = paramSchema.parse(req.params.id);
  const { technical } = feedQuerySchema.parse(req.query);
  res.json(await analyticsService.userActivity(id, technical));
});

export default router;
