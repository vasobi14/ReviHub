import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import {
    clearDatabase,
    createReview,
    createTestTitle,
    createTestUser,
    createToken,
} from './helpers.js';

describe('POST /reviews', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('creates review when authenticated', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();
        const token = createToken(user.id);

        const res = await request(app)
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({
                titleId: title.id,
                score: 8,
                text: 'Great movie',
            });

        expect(res.status).toBe(201);
        expect(res.body.score).toBe(8);
        expect(res.body.text).toBe('Great movie');
        expect(res.body.user.id).toBe(user.id);
    });

    it('returns 401 without token', async () => {
        const title = await createTestTitle();

        const res = await request(app)
            .post('/reviews')
            .send({ titleId: title.id, score: 8, text: 'Great' });

        expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent title', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        const res = await request(app)
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ titleId: 99999, score: 8, text: 'Great' });

        expect(res.status).toBe(404);
    });

    it('returns 400 for invalid score', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();
        const token = createToken(user.id);

        const res = await request(app)
            .post('/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ titleId: title.id, score: 99, text: 'Invalid' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('does not allow concurrent duplicate reviews', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();
        const token = createToken(user.id);

        const [res1, res2] = await Promise.all([
            request(app)
                .post('/reviews')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    titleId: title.id,
                    score: 8,
                    text: 'Review 1',
                }),

            request(app)
                .post('/reviews')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    titleId: title.id,
                    score: 9,
                    text: 'Review 2',
                }),
        ]);

        const statuses = [res1.status, res2.status].sort();

        expect(statuses[0]).toBe(201);
        expect(statuses[1]).toBe(409);
    });
});

describe('DELETE /reviews/:id', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('prevents deleting someone else review', async () => {
        const author = await createTestUser({ email: 'author@test.com' });
        const other = await createTestUser({ email: 'other@test.com' });
        const title = await createTestTitle();

        const review = await createReview({
            titleId: title.id,
            userId: author.id,
            score: 8,
        });

        const otherToken = createToken(other.id);

        const res = await request(app)
            .delete(`/reviews/${review.id}`)
            .set('Authorization', `Bearer ${otherToken}`);

        expect(res.status).toBe(403);
    });
});

describe('GET /reviews/:id', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('returns review by id', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();

        const review = await createReview({
            titleId: title.id,
            userId: user.id,
            score: 8,
            text: 'Great',
        });

        const res = await request(app).get(`/reviews/${review.id}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(review.id);
        expect(res.body.score).toBe(8);
        expect(res.body.user.id).toBe(user.id);
    });

    it('returns 404 for non-existent review', async () => {
        const res = await request(app).get('/reviews/99999');

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid id', async () => {
        const res = await request(app).get('/reviews/abc');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });
});

describe('GET /reviews/mine', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('returns the authenticated user review without pagination', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();
        const review = await createReview({
            titleId: title.id,
            userId: user.id,
            score: 8,
            text: 'My review',
        });
        const token = createToken(user.id);

        const res = await request(app)
            .get(`/reviews/mine?titleId=${title.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(review.id);
    });

    it('returns null when the user has not reviewed the title', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();
        const token = createToken(user.id);

        const res = await request(app)
            .get(`/reviews/mine?titleId=${title.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toBeNull();
    });

    it('requires authentication', async () => {
        const title = await createTestTitle();

        const res = await request(app).get(`/reviews/mine?titleId=${title.id}`);

        expect(res.status).toBe(401);
    });
});

describe('PUT /reviews/:id', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('updates own review', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();

        const review = await createReview({
            titleId: title.id,
            userId: user.id,
            score: 5,
            text: 'Old text',
        });

        const token = createToken(user.id);

        const res = await request(app)
            .put(`/reviews/${review.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                score: 9,
                text: 'New text',
            });

        expect(res.status).toBe(200);
        expect(res.body.score).toBe(9);
        expect(res.body.text).toBe('New text');
    });

    it('prevents updating someone else review', async () => {
        const author = await createTestUser({
            email: 'author@test.com',
        });

        const other = await createTestUser({
            email: 'other@test.com',
        });

        const title = await createTestTitle();

        const review = await createReview({
            titleId: title.id,
            userId: author.id,
            score: 8,
        });

        const token = createToken(other.id);

        const res = await request(app)
            .put(`/reviews/${review.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                score: 10,
                text: 'Hacked',
            });

        expect(res.status).toBe(403);
    });

    it('returns 400 for invalid data', async () => {
        const user = await createTestUser();
        const title = await createTestTitle();

        const review = await createReview({
            titleId: title.id,
            userId: user.id,
            score: 8,
        });

        const token = createToken(user.id);

        const res = await request(app)
            .put(`/reviews/${review.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                score: 99,
                text: 'Invalid',
            });

        expect(res.status).toBe(400);
    });
});

describe('GET /reviews pagination', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('paginates reviews using the configured page size', async () => {
        const title = await createTestTitle();

        for (let i = 0; i < 21; i++) {
            const user = await createTestUser({
                email: `user${i}@test.com`,
            });

            await createReview({
                titleId: title.id,
                userId: user.id,
                score: 8,
                text: `Review ${i}`,
            });
        }

        const page1 = await request(app).get('/reviews?page=1');

        const page2 = await request(app).get('/reviews?page=2');

        expect(page1.status).toBe(200);
        expect(page2.status).toBe(200);

        expect(page1.body.items).toHaveLength(page1.body.pageSize);
        expect(page1.body.totalPages).toBe(
            Math.ceil(page1.body.total / page1.body.pageSize),
        );
        expect(page2.body.items).toHaveLength(page2.body.pageSize);
    });

    it('returns 400 for invalid page', async () => {
        const res = await request(app).get('/reviews?page=abc');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for non-positive page', async () => {
        const res = await request(app).get('/reviews?page=0');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('filters reviews by titleId', async () => {
        const user = await createTestUser();
        const title1 = await createTestTitle({ name: 'Title 1' });
        const title2 = await createTestTitle({ name: 'Title 2' });

        await createReview({ titleId: title1.id, userId: user.id, score: 8 });

        const otherUser = await createTestUser();
        await createReview({
            titleId: title2.id,
            userId: otherUser.id,
            score: 5,
        });

        const res = await request(app).get(`/reviews?titleId=${title1.id}`);

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].titleId).toBe(title1.id);
    });

    it('excludes the given user from results and total', async () => {
        const title = await createTestTitle();
        const me = await createTestUser({ email: 'me@test.com' });
        const other = await createTestUser({ email: 'other@test.com' });

        await createReview({ titleId: title.id, userId: me.id, score: 8 });
        await createReview({ titleId: title.id, userId: other.id, score: 5 });

        const res = await request(app).get(
            `/reviews?titleId=${title.id}&excludeUserId=${me.id}`,
        );

        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].userId).toBe(other.id);
    });
});
