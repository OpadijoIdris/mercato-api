import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import app from '../app.js';
import { resetTestDb } from './helpers/db.js';

const newUser = {
  email: 'Jane@Example.com',
  password: 'longenough',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '+2348012345678',
};

beforeAll(async () => {
  await resetTestDb();
});

describe('users API', () => {
  let id = '';

  it('creates a user and never returns the password', async () => {
    const res = await request(app).post('/users').send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      email: 'jane@example.com',
      firstName: 'Jane',
      role: 'CUSTOMER',
    });
    expect(res.body.data).not.toHaveProperty('password');
    id = res.body.data.id;
  });

  it('409s on a duplicate email', async () => {
    const res = await request(app).post('/users').send(newUser);
    expect(res.status).toBe(409);
  });

  it('400s on an invalid payload', async () => {
    const res = await request(app).post('/users').send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('failed');
  });

  it('lists users with pagination and no password fields', async () => {
    const res = await request(app).get('/users?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).not.toHaveProperty('password');
  });

  it('400s on invalid query params', async () => {
    expect((await request(app).get('/users?limit=500')).status).toBe(400);
    expect((await request(app).get('/users?role=SUPERUSER')).status).toBe(400);
  });

  it('gets, updates and deletes a user', async () => {
    const fetched = await request(app).get(`/users/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data).not.toHaveProperty('password');

    const updated = await request(app).patch(`/users/${id}`).send({ lastName: 'Smith' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.lastName).toBe('Smith');

    expect((await request(app).patch(`/users/${id}`).send({})).status).toBe(400);

    const deleted = await request(app).delete(`/users/${id}`);
    expect(deleted.status).toBe(200);
    expect((await request(app).get(`/users/${id}`)).status).toBe(404);
  });
});
