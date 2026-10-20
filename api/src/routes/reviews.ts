import { type Request, Router } from 'express';
import z from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { reviewService } from '../services/reviewService.js';

const reviewSchema = z.object({
    workId: z.number().int().positive(),
    score: z.coerce.number().int().min(1).max(10),
    text: z.string().max(2000).optional(),
});

const querySchema = z.object({
    workId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().max(100).default(1),
    excludeUserId: z.coerce.number().int().positive().optional(),
});

const mineQuerySchema = z.object({
    workId: z.coerce.number().int().positive(),
});

const updateReviewSchema = z.object({
    score: z.coerce.number().int().min(1).max(10),
    text: z.string().max(2000).optional(),
});

const paramSchema = z.coerce.number().int().positive();

const router = Router();

// GET /reviews?workId=<id>&page=<number>
router.get('/', async (req, res) => {
    const { workId, page, excludeUserId } = querySchema.parse(req.query);
    const result = await reviewService.findMany(workId, page, excludeUserId);
    res.json(result);
});

// GET /reviews/mine?workId=<id>
router.get('/mine', authMiddleware, async (req, res) => {
    const { workId } = mineQuerySchema.parse(req.query);
    const review = await reviewService.findForUser(workId, req.user.id);
    res.json(review);
});

// POST /reviews (protected)
router.post('/', authMiddleware, async (req: Request, res) => {
    const { workId, score, text } = reviewSchema.parse(req.body);
    const review = await reviewService.create(workId, score, text, req.user);
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
    const review = await reviewService.update(id, score, text, req.user.id);
    res.json(review);
});

// DELETE /reviews/:id (protected)
router.delete('/:id', authMiddleware, async (req: Request, res) => {
    const id = paramSchema.parse(req.params.id);
    await reviewService.remove(id, req.user.id);
    res.status(204).send();
});

export default router;
