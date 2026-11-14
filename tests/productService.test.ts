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

  it('lists products newest first', async () => {
    await ProductService.create({ name: 'First', price: 1 });
    await ProductService.create({ name: 'Second', price: 2 });
    const names = (await ProductService.listAll()).map((p) => p.name);
    expect(names).toEqual(['Second', 'First']);
  });
});
