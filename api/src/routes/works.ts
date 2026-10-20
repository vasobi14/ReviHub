import { type Request, Router } from 'express';
import z from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import {
    removeUploadedFile,
    upload,
    validateImageContent,
} from '../middleware/upload.js';
import { workService } from '../services/workService.js';
import { WORK_TYPES } from '../types/work.types.js';

const workSchema = z.object({
    title: z.string().max(200).min(2),
    type: z.enum(WORK_TYPES),
    releaseYear: z.coerce.number().int().min(1888).max(2100).optional(),
    description: z.string().max(1000).optional(),
    removeImage: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => value === 'true'),
});

const querySchema = z.object({
    type: z.enum(WORK_TYPES).optional(),
    q: z.string().max(100).optional(),
    page: z.coerce.number().int().positive().max(1000).default(1),
});

const paramSchema = z.coerce.number().int().positive();

const router = Router();

// GET /works (optionally filtered by type and search query)
router.get('/', async (req, res) => {
    const { type, q, page } = querySchema.parse(req.query);
    const result = await workService.findMany(type, q, page);
    res.json(result);
});

// GET /works/:id
router.get('/:id', async (req, res) => {
    const id = paramSchema.parse(req.params.id);
    const work = await workService.findOne(id);
    res.json(work);
});

// POST /works (protected)
router.post(
    '/',
    authMiddleware,
    upload.single('image'),
    validateImageContent,
    async (req: Request, res) => {
        try {
            const { title, type, releaseYear, description } = workSchema.parse(
                req.body,
            );
            const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

            const work = await workService.create(
                {
                    title,
                    type,
                    releaseYear,
                    description,
                },
                req.user.id,
                imageUrl,
            );
            res.status(201).json(work);
        } catch (error) {
            await removeUploadedFile(req.file);
            throw error;
        }
    },
);

// PUT /works/:id (protected)
router.put(
    '/:id',
    authMiddleware,
    upload.single('image'),
    validateImageContent,
    async (req: Request, res) => {
        try {
            const id = paramSchema.parse(req.params.id);
            const { title, type, releaseYear, description, removeImage } =
                workSchema.parse(req.body);

            const imageUrl = req.file
                ? `/uploads/${req.file.filename}`
                : undefined;

            const work = await workService.update(
                id,
                {
                    title,
                    type,
                    releaseYear,
                    description,
                },
                req.user.id,
                imageUrl,
                removeImage ?? false,
            );

            res.json(work);
        } catch (error) {
            await removeUploadedFile(req.file);
            throw error;
        }
    },
);

//delete /works/:id (protected)
router.delete('/:id', authMiddleware, async (req: Request, res) => {
    const id = paramSchema.parse(req.params.id);
    await workService.remove(id, req.user.id);
    res.status(204).send();
});

export default router;
