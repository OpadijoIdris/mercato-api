import { describe, expect, it } from 'vitest';
import { createProductSchema } from '../src/product/schemas/ProductSchema.js';
import { validate } from '../src/util/validate.js';

describe('createProductSchema', () => {
  it('accepts a valid product, trims the name and strips unknown fields', () => {
    const value = validate(createProductSchema, { name: '  Mug ', price: 1500, extra: 'x' });
    expect(value).toEqual({ name: 'Mug', price: 1500 });
  });

  it('treats an empty description as absent', () => {
    expect(validate(createProductSchema, { name: 'Mug', price: 1, description: '' })).toEqual({
      name: 'Mug',
      price: 1,
    });
  });

  it.each([
    [{ price: 100 }, 'missing name'],
    [{ name: '   ', price: 100 }, 'blank name'],
    [{ name: 'Mug' }, 'missing price'],
    [{ name: 'Mug', price: -1 }, 'negative price'],
    [{ name: 'Mug', price: 9.99 }, 'fractional price'],
    [{ name: 'Mug', price: '100' }, 'string price'],
    [{ name: 'Mug', price: 100, stock: -2 }, 'negative stock'],
  ])('rejects %o (%s) with a 400', (payload: unknown, _label: string) => {
    expect(() => validate(createProductSchema, payload)).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
