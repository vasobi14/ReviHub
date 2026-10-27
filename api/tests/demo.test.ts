import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { deleteOldDemoAccounts } from '../src/services/demoService.js';
import {
  clearDatabase,
  createReview,
  createTestTitle,
  createTestUser,
} from './helpers.js';

const DEMO_KEY = 'test-demo-key-at-least-32-characters';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('POST /auth/demo', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('rejects a wrong key', async () => {
    const res = await request(app)
      .post('/auth/demo')
      .send({ key: 'wrong-key' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('INVALID_DEMO_KEY');
    expect(await prisma.user.count()).toBe(0);
  });

  it('creates a new signed-in demo account on every visit', async () => {
    const first = await request(app).post('/auth/demo').send({ key: DEMO_KEY });
    const second = await request(app)
      .post('/auth/demo')
      .send({ key: DEMO_KEY });

    expect(first.status).toBe(201);
    expect(first.body.user.role).toBe('DEMO');
    expect(second.body.user.id).not.toBe(first.body.user.id);
    expect(first.headers['set-cookie']).toBeDefined();

    const me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${first.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(first.body.user.id);
  });
});

describe('deleteOldDemoAccounts', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('deletes week-old demo accounts with their reviews', async () => {
    const title = await createTestTitle();
    const oldDemo = await createTestUser({ role: 'DEMO' });
    const newDemo = await createTestUser({ role: 'DEMO' });
    const oldUser = await createTestUser();
    await createReview({ titleId: title.id, userId: oldDemo.id, score: 2 });
    await createReview({ titleId: title.id, userId: newDemo.id, score: 8 });

    const weekAgo = new Date(Date.now() - 8 * DAY_MS);
    await prisma.user.updateMany({
      where: { id: { in: [oldDemo.id, oldUser.id] } },
      data: { createdAt: weekAgo },
    });

    await deleteOldDemoAccounts();

    const ids = (await prisma.user.findMany()).map((user) => user.id);
    expect(ids).not.toContain(oldDemo.id);
    expect(ids).toContain(newDemo.id);
    expect(ids).toContain(oldUser.id);

    const stats = await prisma.title.findUniqueOrThrow({
      where: { id: title.id },
    });
    expect(stats).toMatchObject({ reviewCount: 1, averageRating: 8 });
  });
});
