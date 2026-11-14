import { beforeEach, describe, expect, it } from 'vitest';
import ProductService from '../src/product/services/ProductService.js';
import { resetTestDb } from './helpers/db.js';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

beforeEach(async () => {
  await resetTestDb();
});

describe('ProductService', () => {
  it('creates a product, defaulting stock to 0 and description to null', async () => {
    const product = await ProductService.create({ name: 'Mug', price: 1500 });
    expect(product).toMatchObject({ name: 'Mug', price: 1500, stock: 0, description: null });
    expect(product.id).toEqual(expect.any(String));
  });

  it('gets a product by id and 404s when missing', async () => {
    const created = await ProductService.create({ name: 'Cap', price: 900, stock: 3 });
    expect(await ProductService.getById(created.id)).toMatchObject({ name: 'Cap', stock: 3 });
    await expect(ProductService.getById(MISSING_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lists products newest first, a page at a time', async () => {
    for (const name of ['First', 'Second', 'Third'])
      await ProductService.create({ name, price: 1 });

    const page1 = await ProductService.list({ page: 1, limit: 2 });
    expect(page1.items.map((p) => p.name)).toEqual(['Third', 'Second']);
    expect(page1.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const page2 = await ProductService.list({ page: 2, limit: 2 });
    expect(page2.items.map((p) => p.name)).toEqual(['First']);
  });

  it('searches product names case-insensitively, counting only matches', async () => {
    await ProductService.create({ name: 'Classic T-shirt', price: 1 });
    await ProductService.create({ name: 'Denim Jacket', price: 1 });
    const result = await ProductService.list({ page: 1, limit: 20, search: 'shirt' });
    expect(result.items.map((p) => p.name)).toEqual(['Classic T-shirt']);
    expect(result.pagination.total).toBe(1);
  });
});
