import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('GET /health', () => {
    it('returns healthy status when database is available', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            status: 'ok',
            database: 'ok',
        });
    });
});
