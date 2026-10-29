import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { flushRequestLog } from '../src/services/analyticsService.js';
import {
  authenticatedRequest,
  clearDatabase,
  createTestTitle,
  createTestUser,
  createToken,
} from './helpers.js';

const BROWSER = 'Mozilla/5.0 Test';

describe('Request log', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('records an anonymous request with its route and an encrypted IP', async () => {
    const title = await createTestTitle();

    await request(app).get(`/titles/${title.id}`).set('User-Agent', BROWSER);
    await flushRequestLog();

    const [entry] = await prisma.requestLog.findMany();
    expect(entry).toMatchObject({
      method: 'GET',
      path: `/titles/${title.id}`,
      route: '/titles/:id',
      status: 200,
      userId: null,
      userAgent: BROWSER,
    });
    expect(entry.ipEncrypted).not.toContain('127.0.0.1');
  });

  it('links a request on a public route to the signed-in user', async () => {
    const user = await createTestUser();
    const title = await createTestTitle();

    await request(app)
      .get(`/titles/${title.id}`)
      .set('Authorization', `Bearer ${createToken(user.id)}`);
    await flushRequestLog();

    const [entry] = await prisma.requestLog.findMany();
    expect(entry.userId).toBe(user.id);
  });

  it('attributes a login to the user and names root routes without a slash', async () => {
    const user = await createTestUser({
      email: 'login@test.com',
      password: 'password123',
    });

    await request(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '203.0.113.50')
      .send({ email: 'login@test.com', password: 'password123' });
    await request(app).get('/titles?q=dune');
    await flushRequestLog();

    const entries = await prisma.requestLog.findMany({
      orderBy: { id: 'asc' },
    });
    expect(entries[0]).toMatchObject({
      route: '/auth/login',
      userId: user.id,
    });
    expect(entries[1].route).toBe('/titles');
  });

  it('does not record health checks', async () => {
    await request(app).get('/health');
    await flushRequestLog();

    expect(await prisma.requestLog.count()).toBe(0);
  });

  it('skips viewing a user in the admin panel but records deleting one', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const user = await createTestUser();
    const api = await authenticatedRequest(admin.id);

    await api.get(`/admin/users/${user.id}`);
    await api.delete(`/admin/users/${user.id}`);
    await flushRequestLog();

    const entries = await prisma.requestLog.findMany();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      method: 'DELETE',
      route: '/admin/users/:id',
    });
  });
});

describe('Admin analytics', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('is only available to admins', async () => {
    const user = await createTestUser();
    const api = await authenticatedRequest(user.id);

    expect((await api.get('/admin/analytics')).status).toBe(403);
    expect((await api.get(`/admin/users/${user.id}`)).status).toBe(403);
    expect((await api.get('/admin/analytics/feed')).status).toBe(403);
  });

  it('shows totals, top titles and a feed with readable IPs', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const title = await createTestTitle({ name: 'Popular one' });
    await request(app).get(`/titles/${title.id}`);
    await request(app).get(`/titles/${title.id}`);
    await flushRequestLog();
    const api = await authenticatedRequest(admin.id);

    const res = await api.get('/admin/analytics');
    const feed = await api.get('/admin/analytics/feed');

    expect(res.status).toBe(200);
    expect(res.body.day.requests).toBe(2);
    expect(res.body.topTitles[0]).toMatchObject({
      name: 'Popular one',
      views: 2,
    });
    expect(feed.body.entries[0].titleName).toBe('Popular one');
    expect(feed.body.entries[0].ip).toMatch(/127\.0\.0\.1/);
  });

  it('lists technical requests only when asked to', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const user = await createTestUser();
    await (await authenticatedRequest(user.id)).get('/auth/me');
    await flushRequestLog();
    const api = await authenticatedRequest(admin.id);

    const actions = await api.get('/admin/analytics/feed');
    const all = await api.get('/admin/analytics/feed?technical=true');

    const routes = (body: { entries: { route: string }[] }) =>
      body.entries.map((entry) => entry.route);
    expect(routes(actions.body)).not.toContain('/auth/me');
    expect(routes(all.body)).toContain('/auth/me');
  });

  it("includes the user's anonymous requests from before logging in", async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    const user = await createTestUser();
    const title = await createTestTitle({ name: 'Seen before login' });

    // Same browser: first anonymous, then signed in
    await request(app).get(`/titles/${title.id}`).set('User-Agent', BROWSER);
    await request(app)
      .get('/titles')
      .set('User-Agent', BROWSER)
      .set('Authorization', `Bearer ${createToken(user.id)}`);
    await flushRequestLog();

    const api = await authenticatedRequest(admin.id);

    const res = await api.get(`/admin/users/${user.id}`);
    const feed = await api.get(`/admin/analytics/feed?userId=${user.id}`);

    expect(res.status).toBe(200);
    expect(res.body.requests).toBe(2);
    const anonymous = feed.body.entries.find(
      (entry: { userId: number | null }) => entry.userId === null,
    );
    expect(anonymous.titleName).toBe('Seen before login');
  });

  it('pages through older entries', async () => {
    const admin = await createTestUser({ role: 'ADMIN' });
    await prisma.requestLog.createMany({
      data: Array.from({ length: 51 }, () => ({
        method: 'GET',
        path: '/titles',
        route: '/titles',
        status: 200,
        durationMs: 1,
        visitorId: 'visitor',
        ipEncrypted: '',
      })),
    });
    const api = await authenticatedRequest(admin.id);

    const first = await api.get('/admin/analytics/feed');
    const second = await api.get(
      `/admin/analytics/feed?before=${first.body.nextCursor}`,
    );

    expect(first.body.entries).toHaveLength(50);
    expect(second.body.entries).toHaveLength(1);
    expect(second.body.entries[0].id).toBeLessThan(first.body.nextCursor);
    expect(second.body.nextCursor).toBeNull();
  });
});
