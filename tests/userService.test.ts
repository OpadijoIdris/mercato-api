import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '../src/database/prisma.js';
import UserRepository from '../src/user/repository/UserRepository.js';
import UserService from '../src/user/services/UserService.js';
import passwordUtil from '../src/util/password.js';
import { resetTestDb } from './helpers/db.js';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';
const base = { password: 'longenough', firstName: 'Ada', lastName: 'Obi' };

beforeEach(async () => {
  await resetTestDb();
});

describe('UserService', () => {
  it('creates a user with a lowercased email, a bcrypt hash and the CUSTOMER role', async () => {
    const user = await UserService.create({ ...base, email: 'Ada@Example.COM' });
    expect(user).toMatchObject({ email: 'ada@example.com', role: 'CUSTOMER' });
    expect(user).not.toHaveProperty('password');

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      omit: { password: false },
    });
    expect(row.password).not.toBe('longenough');
    expect(await passwordUtil.compare('longenough', row.password)).toBe(true);
  });

  it('rejects a duplicate email regardless of case', async () => {
    await UserService.create({ ...base, email: 'dup@x.com' });
    await expect(UserService.create({ ...base, email: 'DUP@x.com' })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('still 409s when the pre-check is beaten by a concurrent write (DB constraint)', async () => {
    await UserService.create({ ...base, email: 'race@x.com' });
    // Simulate losing the race: the pre-check sees no user, so only the unique index can stop it.
    const spy = vi.spyOn(UserRepository, 'findByEmail').mockResolvedValue(null);
    try {
      await expect(UserService.create({ ...base, email: 'race@x.com' })).rejects.toMatchObject({
        statusCode: 409,
      });
      const other = await UserService.create({ ...base, email: 'other@x.com' });
      await expect(UserService.update(other.id, { email: 'race@x.com' })).rejects.toMatchObject({
        statusCode: 409,
      });
    } finally {
      spy.mockRestore();
    }
  });

  it('lets exactly one of several simultaneous sign-ups with the same email succeed', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => UserService.create({ ...base, email: 'same@x.com' })),
    );
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    for (const r of rejected) expect(r.reason).toMatchObject({ statusCode: 409 });
    expect(await prisma.user.count({ where: { email: 'same@x.com' } })).toBe(1);
  });

  it('paginates newest first and reports totals', async () => {
    for (const n of [1, 2, 3]) await UserService.create({ ...base, email: `u${n}@x.com` });
    const page1 = await UserService.list({ page: 1, limit: 2 });
    expect(page1.items.map((u) => u.email)).toEqual(['u3@x.com', 'u2@x.com']);
    expect(page1.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const page2 = await UserService.list({ page: 2, limit: 2 });
    expect(page2.items.map((u) => u.email)).toEqual(['u1@x.com']);
  });

  it('filters by role and by case-insensitive search', async () => {
    await UserService.create({ ...base, email: 'admin@x.com', firstName: 'Grace', role: 'ADMIN' });
    await UserService.create({ ...base, email: 'cust@x.com', firstName: 'Tunde' });

    const admins = await UserService.list({ page: 1, limit: 20, role: 'ADMIN' });
    expect(admins.items.map((u) => u.email)).toEqual(['admin@x.com']);

    const search = await UserService.list({ page: 1, limit: 20, search: 'tUnD' });
    expect(search.items.map((u) => u.email)).toEqual(['cust@x.com']);
  });

  it('updates a user, guarding email uniqueness but allowing their own email', async () => {
    const a = await UserService.create({ ...base, email: 'a@x.com' });
    await UserService.create({ ...base, email: 'b@x.com' });

    expect(await UserService.update(a.id, { firstName: 'New', email: 'A@x.com' })).toMatchObject({
      firstName: 'New',
      email: 'a@x.com',
    });
    await expect(UserService.update(a.id, { email: 'b@x.com' })).rejects.toMatchObject({
      statusCode: 409,
    });
    await expect(UserService.update(MISSING_ID, { firstName: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('gets and removes a user, 404ing once gone', async () => {
    const user = await UserService.create({ ...base, email: 'gone@x.com' });
    expect(await UserService.getById(user.id)).toMatchObject({ email: 'gone@x.com' });
    await UserService.remove(user.id);
    await expect(UserService.getById(user.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(UserService.remove(user.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
