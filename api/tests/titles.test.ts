// tests/titles.test.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { TITLES_PAGE_SIZE } from '../src/services/titleService.js';
import {
  authenticatedRequest,
  clearDatabase,
  createReview,
  createTestTitle,
  createTestUser,
  createToken,
} from './helpers.js';

const uploadsDir = path.resolve('uploads-test');

describe('GET /titles', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('returns empty array when no titles exist', async () => {
    const res = await request(app).get('/titles');

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('returns list of titles newest first', async () => {
    await createTestTitle({ name: 'Movie A', type: 'movie' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await createTestTitle({ name: 'Game B', type: 'game' });

    const res = await request(app).get('/titles');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].name).toBe('Game B');
    expect(res.body.items[1].name).toBe('Movie A');
  });

  it('filters by type', async () => {
    await createTestTitle({ name: 'Movie A', type: 'movie' });
    await createTestTitle({ name: 'Game B', type: 'game' });

    const res = await request(app).get('/titles?type=movie');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].type).toBe('movie');
  });

  it('returns 400 for invalid type', async () => {
    const res = await request(app).get('/titles?type=banana');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('sorts by number of reviews', async () => {
    const [u1, u2] = [await createTestUser(), await createTestUser()];
    const quiet = await createTestTitle({ name: 'Quiet' });
    const popular = await createTestTitle({ name: 'Popular' });
    await createReview({ titleId: quiet.id, userId: u1.id, score: 9 });
    await createReview({ titleId: popular.id, userId: u1.id, score: 5 });
    await createReview({ titleId: popular.id, userId: u2.id, score: 5 });

    const res = await request(app).get('/titles?sort=popular');

    expect(res.status).toBe(200);
    expect(res.body.items.map((t: { name: string }) => t.name)).toEqual([
      'Popular',
      'Quiet',
    ]);
  });

  it('sorts by average rating, only titles with 3+ reviews', async () => {
    const users = [
      await createTestUser(),
      await createTestUser(),
      await createTestUser(),
    ];
    const review = (titleId: number, scores: number[]) =>
      Promise.all(
        scores.map((score, i) =>
          createReview({ titleId, userId: users[i].id, score }),
        ),
      );
    await createTestTitle({ name: 'Unrated' });
    const few = await createTestTitle({ name: 'Few reviews' });
    const low = await createTestTitle({ name: 'Low' });
    const high = await createTestTitle({ name: 'High' });
    await review(few.id, [10, 10]);
    await review(low.id, [4, 4, 4]);
    await review(high.id, [9, 8, 7]);

    const res = await request(app).get('/titles?sort=rating');

    expect(res.status).toBe(200);
    expect(res.body.items.map((t: { name: string }) => t.name)).toEqual([
      'High',
      'Low',
    ]);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].averageRating).toBe(8);
  });

  it('sorts by release year with undated titles last', async () => {
    await createTestTitle({ name: 'Undated' });
    await createTestTitle({ name: 'Old', releaseYear: 1994 });
    await createTestTitle({ name: 'Recent', releaseYear: 2021 });

    const res = await request(app).get('/titles?sort=year');

    expect(res.status).toBe(200);
    expect(res.body.items.map((t: { name: string }) => t.name)).toEqual([
      'Recent',
      'Old',
      'Undated',
    ]);
  });

  it('returns 400 for invalid sort', async () => {
    const res = await request(app).get('/titles?sort=random');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('Title review stats', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('follow reviews being created, updated and deleted', async () => {
    const title = await createTestTitle();
    const [u1, u2] = [await createTestUser(), await createTestUser()];
    const api1 = await authenticatedRequest(u1.id);
    const api2 = await authenticatedRequest(u2.id);

    const stats = async () => {
      const res = await request(app).get(`/titles/${title.id}`);
      return [res.body.averageRating, res.body.reviewCount];
    };

    const first = await api1
      .post('/reviews')
      .send({ titleId: title.id, score: 8 });
    await api2.post('/reviews').send({ titleId: title.id, score: 4 });
    expect(await stats()).toEqual([6, 2]);

    await api1.put(`/reviews/${first.body.id}`).send({ score: 10 });
    expect(await stats()).toEqual([7, 2]);

    await api1.delete(`/reviews/${first.body.id}`);
    expect(await stats()).toEqual([4, 1]);
  });
});

describe('GET /titles/:id', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('returns title by id', async () => {
    const title = await createTestTitle({ name: 'Movie A', type: 'movie' });

    const res = await request(app).get(`/titles/${title.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(title.id);
    expect(res.body.name).toBe('Movie A');
  });

  it('returns 404 for non-existent title', async () => {
    const res = await request(app).get('/titles/99999');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid id', async () => {
    const res = await request(app).get('/titles/abc');

    expect(res.status).toBe(400);
  });
});

describe('POST /titles', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates title when authenticated', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);

    const res = await request(app)
      .post('/titles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Movie',
        type: 'movie',
        releaseYear: 2024,
        description: 'A great movie',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Movie');
    expect(res.body.type).toBe('movie');
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/titles')
      .send({ name: 'New Movie', type: 'movie' });

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid data', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);

    const res = await request(app)
      .post('/titles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A', type: 'movie' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects image uploads whose content does not match the MIME type', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);

    const res = await request(app)
      .post('/titles')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Spoofed image')
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

  it('cleans up an image when title validation fails', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2bkAAAAASUVORK5CYII=',
      'base64',
    );

    const res = await request(app)
      .post('/titles')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'A')
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

describe('PUT /titles/:id', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('updates title', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);

    const title = await createTestTitle({
      name: 'Old Title',
      type: 'movie',
      createdById: user.id,
    });

    const res = await request(app)
      .put(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Title',
        type: 'movie',
        releaseYear: 2024,
        description: 'Updated description',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Title');
    expect(res.body.releaseYear).toBe(2024);
  });

  it('allows clearing the description', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);
    const title = await createTestTitle({
      name: 'Title with description',
      type: 'movie',
      description: 'Description to clear',
      createdById: user.id,
    });

    const res = await request(app)
      .put(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', title.name)
      .field('type', title.type)
      .field('description', '');

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('');
  });

  it('clears the release year when it is sent empty and keeps it when omitted', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);
    const title = await createTestTitle({
      name: 'Title with a year',
      type: 'movie',
      releaseYear: 1999,
      createdById: user.id,
    });
    const update = () =>
      request(app)
        .put(`/titles/${title.id}`)
        .set('Authorization', `Bearer ${token}`)
        .field('name', title.name)
        .field('type', title.type);

    const kept = await update();
    expect(kept.body.releaseYear).toBe(1999);

    const cleared = await update().field('releaseYear', '');
    expect(cleared.status).toBe(200);
    expect(cleared.body.releaseYear).toBeNull();
  });

  it('returns 404 for non-existent title', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);

    const res = await request(app)
      .put('/titles/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Title',
        type: 'movie',
      });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 403 when updating someone else title', async () => {
    const owner = await createTestUser({ email: 'owner@test.com' });
    const other = await createTestUser({ email: 'other@test.com' });
    const otherToken = createToken(other.id);

    const title = await createTestTitle({
      name: 'Owned Title',
      type: 'movie',
      createdById: owner.id,
    });

    const res = await request(app)
      .put(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        name: 'Hacked Title',
        type: 'movie',
      });

    expect(res.status).toBe(403);
  });

  it('cleans up an uploaded image when ownership validation fails', async () => {
    const owner = await createTestUser({ email: 'image-owner@test.com' });
    const other = await createTestUser({ email: 'image-other@test.com' });
    const token = createToken(other.id);
    const title = await createTestTitle({
      name: 'Owner title',
      type: 'movie',
      createdById: owner.id,
    });
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2bkAAAAASUVORK5CYII=',
      'base64',
    );

    const res = await request(app)
      .put(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', title.name)
      .field('type', title.type)
      .attach('image', png, {
        filename: 'poster.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(403);
    const uploadedFiles = await fs.readdir(uploadsDir);
    expect(uploadedFiles.filter((file) => file !== '.gitkeep')).toEqual([]);
  });

  it('returns 401 without token', async () => {
    const title = await createTestTitle();

    const res = await request(app).put(`/titles/${title.id}`).send({
      name: 'New Title',
      type: 'movie',
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid data', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);

    const title = await createTestTitle({ createdById: user.id });

    const res = await request(app)
      .put(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'A',
        type: 'movie',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /titles/:id', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('deletes own title', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);
    const title = await createTestTitle({ createdById: user.id });

    const res = await request(app)
      .delete(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/titles/${title.id}`);
    expect(getRes.status).toBe(404);
  });

  it('deletes the title poster file', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2bkAAAAASUVORK5CYII=',
      'base64',
    );

    const created = await request(app)
      .post('/titles')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Title with poster')
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
      .delete(`/titles/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(204);
    await expect(fs.access(imagePath)).rejects.toThrow();
  });

  it('returns 403 when deleting someone else title', async () => {
    const owner = await createTestUser({ email: 'owner@test.com' });
    const other = await createTestUser({ email: 'other@test.com' });
    const otherToken = createToken(other.id);

    const title = await createTestTitle({ createdById: owner.id });

    const res = await request(app)
      .delete(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent title', async () => {
    const user = await createTestUser();
    const token = createToken(user.id);

    const res = await request(app)
      .delete('/titles/99999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 401 without token', async () => {
    const user = await createTestUser();
    const title = await createTestTitle({ createdById: user.id });

    const res = await request(app).delete(`/titles/${title.id}`);

    expect(res.status).toBe(401);
  });

  it('cascades review deletion', async () => {
    const owner = await createTestUser();
    const reviewer = await createTestUser({ email: 'reviewer@test.com' });
    const token = createToken(owner.id);

    const title = await createTestTitle({ createdById: owner.id });

    const review = await createReview({
      titleId: title.id,
      userId: reviewer.id,
      score: 8,
      text: 'Nice',
    });

    await request(app)
      .delete(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${token}`);

    const reviewRes = await request(app).get(`/reviews/${review.id}`);
    expect(reviewRes.status).toBe(404);
  });
});

describe('GET /titles pagination', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('paginates titles by TITLES_PAGE_SIZE', async () => {
    const pageSize = TITLES_PAGE_SIZE;
    for (let i = 0; i < pageSize * 2; i++) {
      await createTestTitle({
        name: `Title ${String(i).padStart(2, '0')}`,
        type: 'movie',
      });
    }

    const page1 = await request(app).get('/titles?page=1');
    const page2 = await request(app).get('/titles?page=2');

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

  it('returns titles sorted by createdAt desc', async () => {
    await createTestTitle({ name: 'First' });
    await new Promise((r) => setTimeout(r, 5));
    await createTestTitle({ name: 'Second' });
    await new Promise((r) => setTimeout(r, 5));
    await createTestTitle({ name: 'Third' });

    const res = await request(app).get('/titles');

    expect(res.body.items.map((w: { name: string }) => w.name)).toEqual([
      'Third',
      'Second',
      'First',
    ]);
  });
});
