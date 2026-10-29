import { type Request, Router } from 'express';
import z from 'zod';
import { authMiddleware, getAuthUser } from '../middleware/auth.js';
import {
  removeUploadedFile,
  upload,
  validateImageContent,
} from '../middleware/upload.js';
import { titleService } from '../services/titleService.js';
import { TITLE_SORTS, TITLE_TYPES } from '../types/title.types.js';

const titleSchema = z.object({
  name: z.string().max(200).min(2),
  type: z.enum(TITLE_TYPES),
  releaseYear: z
    .union([
      z.literal('').transform(() => null),
      z.coerce.number().int().min(1888).max(2100),
    ])
    .optional(),
  description: z.string().max(1000).optional(),
  removeImage: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

const querySchema = z.object({
  type: z.enum(TITLE_TYPES).optional(),
  q: z.string().max(100, 'Search query is too long').optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .max(1000, 'Page is out of range')
    .default(1),
  sort: z.enum(TITLE_SORTS).default('new'),
});

const paramSchema = z.coerce.number().int().positive();

const router = Router();

// GET /titles (optionally filtered by type and search query, sorted)
router.get('/', async (req, res) => {
  const { type, q, page, sort } = querySchema.parse(req.query);
  const result = await titleService.findMany(type, q, page, sort);
  res.json(result);
});

// GET /titles/:id
router.get('/:id', async (req, res) => {
  const id = paramSchema.parse(req.params.id);
  const title = await titleService.findOne(id);
  res.json(title);
});

// POST /titles (protected)
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  validateImageContent,
  async (req: Request, res) => {
    try {
      const { name, type, releaseYear, description } = titleSchema.parse(
        req.body,
      );
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const title = await titleService.create(
        {
          name,
          type,
          releaseYear,
          description,
        },
        getAuthUser(req).id,
        imageUrl,
      );
      res.status(201).json(title);
    } catch (error) {
      await removeUploadedFile(req.file);
      throw error;
    }
  },
);

// PUT /titles/:id (protected)
router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  validateImageContent,
  async (req: Request, res) => {
    try {
      const id = paramSchema.parse(req.params.id);
      const { name, type, releaseYear, description, removeImage } =
        titleSchema.parse(req.body);

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const title = await titleService.update(
        id,
        {
          name,
          type,
          releaseYear,
          description,
        },
        getAuthUser(req),
        imageUrl,
        removeImage ?? false,
      );

      res.json(title);
    } catch (error) {
      await removeUploadedFile(req.file);
      throw error;
    }
  },
);

// DELETE /titles/:id (protected)
router.delete('/:id', authMiddleware, async (req: Request, res) => {
  const id = paramSchema.parse(req.params.id);
  await titleService.remove(id, getAuthUser(req));
  res.status(204).send();
});

export default router;
