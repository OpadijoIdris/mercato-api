import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { resetTestDb } from './helpers/db.js';

beforeAll(async () => {
  await resetTestDb();
});

describe('products API', () => {
  it('creates, lists and fetches a product', async () => {
    const created = await request(app)
      .post('/products')
      .send({ name: 'T-shirt', description: 'Cotton', price: 500000, stock: 10 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      status: 'success',
      message: 'Product created',
      data: { name: 'T-shirt', price: 500000, stock: 10 },
    });
    const id = created.body.data.id;

    const list = await request(app).get('/products');
    expect(list.status).toBe(200);
    expect(list.body.data.map((p: { id: string }) => p.id)).toContain(id);

    const fetched = await request(app).get(`/products/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.description).toBe('Cotton');
  });

  it('rejects an invalid payload with a 400 envelope', async () => {
    const res = await request(app).post('/products').send({ name: 'Bad', price: -5 });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  it('rejects a malformed JSON body with a 400', async () => {
    const res = await request(app)
      .post('/products')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: 'failed', message: 'Malformed JSON body', data: null });
  });

  it('404s for an unknown product', async () => {
    const res = await request(app).get('/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });
});
