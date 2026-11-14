import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('health + fallbacks', () => {
  it('GET / and GET /health report the service is up', async () => {
    for (const path of ['/', '/health']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'success', message: 'Service is up' });
    }
  });

  it('unknown routes return a 404 envelope', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'failed', message: 'Not found', data: null });
  });
});
