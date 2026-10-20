import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/emailService.js', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

import app from '../src/app.js';
import {
    clearDatabase,
    createExpiredToken,
    createTestUser,
    createToken,
    deleteUser,
} from './helpers.js';

beforeAll(() => {
    app.set('trust proxy', 1);
});

describe('POST /auth/register', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('returns 429 after too many failed registration attempts', async () => {
        const testIp = '203.0.113.11';

        await request(app)
            .post('/auth/register')
            .set('X-Forwarded-For', testIp)
            .send({
                email: 'rate-limit@test.com',
                password: 'password123',
                name: 'Test',
            });

        const responses = [];

        for (let i = 0; i < 11; i++) {
            const res = await request(app)
                .post('/auth/register')
                .set('X-Forwarded-For', testIp)
                .send({
                    email: 'rate-limit@test.com',
                    password: 'password123',
                    name: 'Test',
                });

            responses.push(res);
        }

        expect(responses.slice(0, 5).every((res) => res.status === 409)).toBe(
            true,
        );
        expect(responses[10].status).toBe(429);
        expect(responses[10].body.code).toBe('RATE_LIMITED');
    });

    it('registers a new user', async () => {
        const res = await request(app).post('/auth/register').send({
            email: 'new@test.com',
            password: 'password123',
            name: 'New',
        });

        expect(res.status).toBe(201);
        expect(res.body.email).toBe('new@test.com');
        expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('returns 409 for duplicate email', async () => {
        await createTestUser({ email: 'dup@test.com' });

        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'dup@test.com', password: 'password123' });

        expect(res.status).toBe(409);
        expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('returns 400 for invalid email', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'not-an-email', password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for short password', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'test@test.com', password: '123' });

        expect(res.status).toBe(400);
    });
});

describe('POST /auth/login', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('returns 429 after too many failed login attempts', async () => {
        const testIp = '203.0.113.10';

        const responses = [];

        for (let i = 0; i < 6; i++) {
            const res = await request(app)
                .post('/auth/login')
                .set('X-Forwarded-For', testIp)
                .send({
                    email: 'not-existing@test.com',
                    password: 'wrong-password',
                });

            responses.push(res);
        }

        expect(responses.slice(0, 5).every((res) => res.status === 401)).toBe(
            true,
        );
        expect(responses[5].status).toBe(429);
        expect(responses[5].body.code).toBe('RATE_LIMITED');
    });

    it('returns token for valid credentials', async () => {
        await createTestUser({
            email: 'user@test.com',
            password: 'password123',
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
    });

    it('returns 401 for invalid password', async () => {
        await createTestUser({
            email: 'user@test.com',
            password: 'password123',
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'wrong123' });

        expect(res.status).toBe(401);
    });

    it('returns 401 for non-existent user', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'ghost@test.com', password: 'password123' });

        expect(res.status).toBe(401);
    });
});

describe('GET /auth/me', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('returns current user with valid token', async () => {
        const user = await createTestUser({ email: 'me@test.com', name: 'Me' });
        const token = createToken(user.id);

        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(user.id);
        expect(res.body.email).toBe('me@test.com');
        expect(res.body.name).toBe('Me');
    });

    it('returns 401 without token', async () => {
        const res = await request(app).get('/auth/me');
        expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', 'Bearer invalid.token.here');

        expect(res.status).toBe(401);
    });

    it('returns 401 for deleted user', async () => {
        const user = await createTestUser();
        const token = createToken(user.id);

        // Удаляем пользователя
        await deleteUser(user.id);

        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('USER_NOT_FOUND');
    });

    it('returns 401 for expired token', async () => {
        const user = await createTestUser();
        const token = createExpiredToken(user.id);

        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('returns current user with token received from login', async () => {
        await createTestUser({
            email: 'flow@test.com',
            password: 'password123',
            name: 'Flow User',
        });

        const loginRes = await request(app).post('/auth/login').send({
            email: 'flow@test.com',
            password: 'password123',
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty('accessToken');

        const meRes = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

        expect(meRes.status).toBe(200);
        expect(meRes.body.email).toBe('flow@test.com');
        expect(meRes.body.name).toBe('Flow User');
    });
});

describe('POST /auth/verify-email', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('verifies email with correct code', async () => {
        await request(app).post('/auth/register').send({
            email: 'verify@test.com',
            password: 'password123',
        });

        const verifyRes = await request(app).post('/auth/verify-email').send({
            email: 'verify@test.com',
            code: '123456',
        });

        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.success).toBe(true);

        const loginRes = await request(app).post('/auth/login').send({
            email: 'verify@test.com',
            password: 'password123',
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty('accessToken');
    });

    it('returns 400 for invalid code', async () => {
        await request(app).post('/auth/register').send({
            email: 'verify2@test.com',
            password: 'password123',
        });

        const res = await request(app).post('/auth/verify-email').send({
            email: 'verify2@test.com',
            code: '000000',
        });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_CODE');
    });

    it('returns 400 for non-existent user', async () => {
        const res = await request(app).post('/auth/verify-email').send({
            email: 'ghost@test.com',
            code: '123456',
        });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_CODE');
    });

    it('returns 400 for invalid code format', async () => {
        const res = await request(app).post('/auth/verify-email').send({
            email: 'test@test.com',
            code: 'abc',
        });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('blocks login until email is verified', async () => {
        await createTestUser({
            email: 'unverified@test.com',
            password: 'password123',
            emailVerified: false,
        });

        const res = await request(app).post('/auth/login').send({
            email: 'unverified@test.com',
            password: 'password123',
        });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });
});
