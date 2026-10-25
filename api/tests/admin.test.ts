import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import {
  authenticatedRequest,
  clearDatabase,
  createReview,
  createTestTitle,
  createTestUser,
} from './helpers.js';

describe('Admin access', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/admin/users');

    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user', async () => {
    const user = await createTestUser();
    const api = await authenticatedRequest(user.id);

    const res = await api.get('/admin/users');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('returns the role from /auth/me', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const api = await authenticatedRequest(admin.id);

    const res = await api.get('/auth/me');

    expect(res.body.role).toBe('ADMIN');
  });
});

describe('GET /admin/users', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('lists users with their title and review counts', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const author = await createTestUser({ email: 'author@test.com' });
    const title = await createTestTitle({ createdById: author.id });
    await createReview({ titleId: title.id, userId: author.id, score: 7 });
    const api = await authenticatedRequest(admin.id);

    const res = await api.get('/admin/users');

    expect(res.status).toBe(200);
    const listed = res.body.find(
      (u: { email: string }) => u.email === 'author@test.com',
    );
    expect(listed._count).toEqual({ titles: 1, reviews: 1 });
    expect(listed).not.toHaveProperty('passwordHash');
  });
});

describe('DELETE /admin/users/:id', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('removes the user with their titles and reviews, keeping stats right', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const spammer = await createTestUser();
    const other = await createTestUser();

    const spamTitle = await createTestTitle({ createdById: spammer.id });
    const otherTitle = await createTestTitle({ createdById: other.id });
    await createReview({
      titleId: spamTitle.id,
      userId: other.id,
      score: 5,
    });
    await createReview({
      titleId: otherTitle.id,
      userId: other.id,
      score: 8,
    });
    await createReview({
      titleId: otherTitle.id,
      userId: spammer.id,
      score: 1,
    });
    const api = await authenticatedRequest(admin.id);

    const res = await api.delete(`/admin/users/${spammer.id}`);

    expect(res.status).toBe(204);
    expect(
      await prisma.user.findUnique({ where: { id: spammer.id } }),
    ).toBeNull();
    expect(
      await prisma.title.findUnique({ where: { id: spamTitle.id } }),
    ).toBeNull();
    expect(await prisma.review.count({ where: { userId: spammer.id } })).toBe(
      0,
    );

    const stats = await prisma.title.findUniqueOrThrow({
      where: { id: otherTitle.id },
    });
    expect(stats.reviewCount).toBe(1);
    expect(stats.averageRating).toBe(8);
  });

  it('does not let an admin delete themselves', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const api = await authenticatedRequest(admin.id);

    const res = await api.delete(`/admin/users/${admin.id}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CANNOT_DELETE_SELF');
  });

  it('does not delete other admins', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const otherAdmin = await createTestUser({ role: 'ADMIN' });
    const api = await authenticatedRequest(admin.id);

    const res = await api.delete(`/admin/users/${otherAdmin.id}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a missing user', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const api = await authenticatedRequest(admin.id);

    const res = await api.delete('/admin/users/99999');

    expect(res.status).toBe(404);
  });
});

describe('Moderating content', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("lets an admin delete someone else's title", async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const title = await createTestTitle();
    const api = await authenticatedRequest(admin.id);

    const res = await api.delete(`/titles/${title.id}`);

    expect(res.status).toBe(204);
  });

  it("lets an admin delete someone else's review", async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const author = await createTestUser();
    const title = await createTestTitle();
    const review = await createReview({
      titleId: title.id,
      userId: author.id,
      score: 6,
    });
    const api = await authenticatedRequest(admin.id);

    const res = await api.delete(`/reviews/${review.id}`);

    expect(res.status).toBe(204);
  });

  it("does not let an admin edit someone else's review", async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const author = await createTestUser();
    const title = await createTestTitle();
    const review = await createReview({
      titleId: title.id,
      userId: author.id,
      score: 6,
    });
    const api = await authenticatedRequest(admin.id);

    const res = await api.put(`/reviews/${review.id}`).send({ score: 1 });

    expect(res.status).toBe(403);
  });
});
