import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/app.js';
import ProductService from '../src/product/services/ProductService.js';
import AppError from '../src/util/AppError.js';

afterEach(() => {
  vi.restoreAllMocks();
});

// Controllers no longer catch: these prove a rejected async handler still reaches the error
// middleware (Express 5) and comes back as a proper envelope.
describe('central error handling', () => {
  it('turns an unexpected error into a generic 500 without leaking its message', async () => {
    vi.spyOn(ProductService, 'listAll').mockRejectedValue(new Error('connection refused'));
    const res = await request(app).get('/products');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: 'failed', message: 'An error occurred', data: null });
  });

  it('passes an AppError thrown from a service straight through', async () => {
    vi.spyOn(ProductService, 'listAll').mockRejectedValue(new AppError(409, 'Conflict here'));
    const res = await request(app).get('/products');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ status: 'failed', message: 'Conflict here', data: null });
  });

  it('keeps the status of errors raised by Express itself (413 payload too large)', async () => {
    const res = await request(app)
      .post('/products')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'x'.repeat(200_000), price: 1 }));
    expect(res.status).toBe(413);
    expect(res.body.status).toBe('failed');
  });
});
