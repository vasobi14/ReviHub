import { type Request, Router } from 'express';
import z from 'zod';
import { authMiddleware, getAuthUser } from '../middleware/auth.js';
import { reviewService } from '../services/reviewService.js';

const reviewSchema = z.object({
  titleId: z.number().int().positive(),
  score: z.coerce.number().int().min(1).max(10),
  text: z
    .string()
    .max(2000, 'Review must be at most 2000 characters')
    .optional(),
});

const querySchema = z.object({
  titleId: z.coerce.number().int().positive().optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .max(1000, 'Page is out of range')
    .default(1),
  excludeUserId: z.coerce.number().int().positive().optional(),
});

const mineQuerySchema = z.object({
  titleId: z.coerce.number().int().positive(),
});

const updateReviewSchema = z.object({
  score: z.coerce.number().int().min(1).max(10),
  text: z
    .string()
    .max(2000, 'Review must be at most 2000 characters')
    .optional(),
});

const paramSchema = z.coerce.number().int().positive();

const router = Router();

// GET /reviews?titleId=<id>&page=<number>
router.get('/', async (req, res) => {
  const { titleId, page, excludeUserId } = querySchema.parse(req.query);
  const result = await reviewService.findMany(titleId, page, excludeUserId);
  res.json(result);
});

// GET /reviews/mine?titleId=<id>
router.get('/mine', authMiddleware, async (req, res) => {
  const { titleId } = mineQuerySchema.parse(req.query);
  const review = await reviewService.findForUser(titleId, getAuthUser(req).id);
  res.json(review);
});

// POST /reviews (protected)
router.post('/', authMiddleware, async (req: Request, res) => {
  const { titleId, score, text } = reviewSchema.parse(req.body);
  const review = await reviewService.create(
    titleId,
    score,
    text,
    getAuthUser(req).id,
  );
  res.status(201).json(review);
});

// GET /reviews/:id
router.get('/:id', async (req, res) => {
  const id = paramSchema.parse(req.params.id);
  const review = await reviewService.findOne(id);
  res.json(review);
});

// PUT /reviews/:id (protected)
router.put('/:id', authMiddleware, async (req: Request, res) => {
  const id = paramSchema.parse(req.params.id);
  const { score, text } = updateReviewSchema.parse(req.body);
  const review = await reviewService.update(
    id,
    score,
    text,
    getAuthUser(req).id,
  );
  res.json(review);
});

// DELETE /reviews/:id (protected)
router.delete('/:id', authMiddleware, async (req: Request, res) => {
  const id = paramSchema.parse(req.params.id);
  await reviewService.remove(id, getAuthUser(req));
  res.status(204).send();
});

export default router;
