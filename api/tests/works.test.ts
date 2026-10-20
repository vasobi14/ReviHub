// tests/works.test.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import config from '../src/config/env.js';
import {
    clearDatabase,
    createReview,
    createTestUser,
    createTestWork,
    createToken,
} from './helpers.js';

const uploadsDir = path.resolve('uploads-test');

describe('GET /works', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('returns empty array when no works exist', async () => {
        const res = await request(app).get('/works');

        expect(res.status).toBe(200);
        expect(res.body.items).toEqual([]);
    });

    it('returns list of works newest first', async () => {
        await createTestWork({ title: 'Movie A', type: 'movie' });
        await new Promise((resolve) => setTimeout(resolve, 5));
        await createTestWork({ title: 'Game B', type: 'game' });

        const res = await request(app).get('/works');

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.items[0].title).toBe('Game B');
        expect(res.body.items[1].title).toBe('Movie A');
    });

    it('filters by type', async () => {
        await createTestWork({ title: 'Movie A', type: 'movie' });
        await createTestWork({ title: 'Game B', type: 'game' });

        const res = await request(app).get('/works?type=movie');

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].type).toBe('movie');
    });

    it('returns 400 for invalid type', async () => {
        const res = await request(app).get('/works?type=banana');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });
});

describe('GET /works/:id', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('returns work by id', async () => {
        const work = await createTestWork({ title: 'Movie A', type: 'movie' });

        const res = await request(app).get(`/works/${work.id}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(work.id);
        expect(res.body.title).toBe('Movie A');
    });

    it('returns 404 for non-existent work', async () => {
        const res = await request(app).get('/works/99999');

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid id', async () => {
        const res = await request(app).get('/works/abc');

        expect(res.status).toBe(400);
    });
});

describe('POST /works', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('creates work when authenticated', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const res = await request(app)
            .post('/works')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'New Movie',
                type: 'movie',
                releaseYear: 2024,
                description: 'A great movie',
            });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('New Movie');
        expect(res.body.type).toBe('movie');
    });

    it('returns 401 without token', async () => {
        const res = await request(app)
            .post('/works')
            .send({ title: 'New Movie', type: 'movie' });

        expect(res.status).toBe(401);
    });

    it('returns 400 for invalid data', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const res = await request(app)
            .post('/works')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'A', type: 'movie' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects image uploads whose content does not match the MIME type', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const res = await request(app)
            .post('/works')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Spoofed image')
            .field('type', 'movie')
            .attach('image', Buffer.from('not an image'), {
                filename: 'cover.jpg',
                contentType: 'image/jpeg',
            });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_IMAGE_TYPE');
        const uploadedFiles = await fs.readdir(uploadsDir);
        expect(uploadedFiles.filter((file) => file !== '.gitkeep')).toEqual([]);
    });

    it('cleans up an image when work validation fails', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);
        const png = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2bkAAAAASUVORK5CYII=',
            'base64',
        );

        const res = await request(app)
            .post('/works')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'A')
            .field('type', 'movie')
            .attach('image', png, {
                filename: 'poster.png',
                contentType: 'image/png',
            });

        expect(res.status).toBe(400);
        const uploadedFiles = await fs.readdir(uploadsDir);
        expect(uploadedFiles.filter((file) => file !== '.gitkeep')).toEqual([]);
    });
});

describe('PUT /works/:id', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('updates work', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const work = await createTestWork({
            title: 'Old Title',
            type: 'movie',
            createdById: user.id,
        });

        const res = await request(app)
            .put(`/works/${work.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'New Title',
                type: 'movie',
                releaseYear: 2024,
                description: 'Updated description',
            });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('New Title');
        expect(res.body.releaseYear).toBe(2024);
    });

    it('allows clearing the description', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);
        const work = await createTestWork({
            title: 'Work with description',
            type: 'movie',
            description: 'Description to clear',
            createdById: user.id,
        });

        const res = await request(app)
            .put(`/works/${work.id}`)
            .set('Authorization', `Bearer ${token}`)
            .field('title', work.title)
            .field('type', work.type)
            .field('description', '');

        expect(res.status).toBe(200);
        expect(res.body.description).toBe('');
    });

    it('returns 404 for non-existent work', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const res = await request(app)
            .put('/works/99999')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'New Title',
                type: 'movie',
            });

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('NOT_FOUND');
    });

    it('returns 403 when updating someone else work', async () => {
        const owner = await createTestUser({ email: 'owner@test.com' });
        const other = await createTestUser({ email: 'other@test.com' });
        const otherToken = createToken(other.id);

        const work = await createTestWork({
            title: 'Owned Work',
            type: 'movie',
            createdById: owner.id,
        });

        const res = await request(app)
            .put(`/works/${work.id}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({
                title: 'Hacked Title',
                type: 'movie',
            });

        expect(res.status).toBe(403);
    });

    it('cleans up an uploaded image when ownership validation fails', async () => {
        const owner = await createTestUser({ email: 'image-owner@test.com' });
        const other = await createTestUser({ email: 'image-other@test.com' });
        const token = createToken(other.id);
        const work = await createTestWork({
            title: 'Owner work',
            type: 'movie',
            createdById: owner.id,
        });
        const png = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2bkAAAAASUVORK5CYII=',
            'base64',
        );

        const res = await request(app)
            .put(`/works/${work.id}`)
            .set('Authorization', `Bearer ${token}`)
            .field('title', work.title)
            .field('type', work.type)
            .attach('image', png, {
                filename: 'poster.png',
                contentType: 'image/png',
            });

        expect(res.status).toBe(403);
        const uploadedFiles = await fs.readdir(uploadsDir);
        expect(uploadedFiles.filter((file) => file !== '.gitkeep')).toEqual([]);
    });

    it('returns 401 without token', async () => {
        const work = await createTestWork();

        const res = await request(app).put(`/works/${work.id}`).send({
            title: 'New Title',
            type: 'movie',
        });

        expect(res.status).toBe(401);
    });

    it('returns 400 for invalid data', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const work = await createTestWork({ createdById: user.id });

        const res = await request(app)
            .put(`/works/${work.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'A',
                type: 'movie',
            });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });
});

describe('DELETE /works/:id', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('deletes own work', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);
        const work = await createTestWork({ createdById: user.id });

        const res = await request(app)
            .delete(`/works/${work.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(204);

        const getRes = await request(app).get(`/works/${work.id}`);
        expect(getRes.status).toBe(404);
    });

    it('deletes the work poster file', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);
        const png = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2bkAAAAASUVORK5CYII=',
            'base64',
        );

        const created = await request(app)
            .post('/works')
            .set('Authorization', `Bearer ${token}`)
            .field('title', 'Work with poster')
            .field('type', 'movie')
            .attach('image', png, {
                filename: 'poster.png',
                contentType: 'image/png',
            });

        expect(created.status).toBe(201);
        const imagePath = path.join(
            uploadsDir,
            path.basename(created.body.imageUrl),
        );
        await expect(fs.access(imagePath)).resolves.toBeUndefined();

        const deleted = await request(app)
            .delete(`/works/${created.body.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleted.status).toBe(204);
        await expect(fs.access(imagePath)).rejects.toThrow();
    });

    it('returns 403 when deleting someone else work', async () => {
        const owner = await createTestUser({ email: 'owner@test.com' });
        const other = await createTestUser({ email: 'other@test.com' });
        const otherToken = createToken(other.id);

        const work = await createTestWork({ createdById: owner.id });

        const res = await request(app)
            .delete(`/works/${work.id}`)
            .set('Authorization', `Bearer ${otherToken}`);

        expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent work', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const res = await request(app)
            .delete('/works/99999')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('NOT_FOUND');
    });

    it('returns 401 without token', async () => {
        const user = await createTestUser();
        const work = await createTestWork({ createdById: user.id });

        const res = await request(app).delete(`/works/${work.id}`);

        expect(res.status).toBe(401);
    });

    it('cascades review deletion', async () => {
        const owner = await createTestUser();
        const reviewer = await createTestUser({ email: 'reviewer@test.com' });
        const token = createToken(owner.id);

        const work = await createTestWork({ createdById: owner.id });

        const review = await createReview({
            workId: work.id,
            userId: reviewer.id,
            score: 8,
            text: 'Nice',
        });

        await request(app)
            .delete(`/works/${work.id}`)
            .set('Authorization', `Bearer ${token}`);

        const reviewRes = await request(app).get(`/reviews/${review.id}`);
        expect(reviewRes.status).toBe(404);
    });
});

describe('GET /works pagination', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('paginates works using the configured page size', async () => {
        const pageSize = config.pageSize;
        for (let i = 0; i < pageSize * 2; i++) {
            await createTestWork({
                title: `Work ${String(i).padStart(2, '0')}`,
                type: 'movie',
            });
        }

        const page1 = await request(app).get('/works?page=1');
        const page2 = await request(app).get('/works?page=2');

        expect(page1.body.items).toHaveLength(page1.body.pageSize);
        expect(page1.body.total).toBe(
            page1.body.items.length + page2.body.items.length,
        );
        expect(page1.body.totalPages).toBe(
            Math.ceil(page1.body.total / page1.body.pageSize),
        );

        expect(page2.body.items).toHaveLength(
            page2.body.total - page1.body.pageSize,
        );

        const page1Ids = page1.body.items.map((w: { id: number }) => w.id);
        const page2Ids = page2.body.items.map((w: { id: number }) => w.id);
        expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids));
    });

    it('returns works sorted by createdAt desc', async () => {
        await createTestWork({ title: 'First' });
        await new Promise((r) => setTimeout(r, 5));
        await createTestWork({ title: 'Second' });
        await new Promise((r) => setTimeout(r, 5));
        await createTestWork({ title: 'Third' });

        const res = await request(app).get('/works');

        expect(res.body.items.map((w: { title: string }) => w.title)).toEqual([
            'Third',
            'Second',
            'First',
        ]);
    });
});
