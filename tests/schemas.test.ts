import { describe, expect, it } from 'vitest';
import openapi from '../src/docs/openapi.js';
import { createProductSchema } from '../src/product/schemas/ProductSchema.js';
import { createUserSchema, updateUserSchema } from '../src/user/schemas/UserSchema.js';
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
    [{ name: 'Mug', price: 2_147_483_648 }, 'price above the INTEGER column limit'],
  ])('rejects %o (%s) with a 400', (payload: unknown, _label: string) => {
    expect(() => validate(createProductSchema, payload)).toThrow(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('names the failing field in the error message', () => {
    expect(() => validate(createProductSchema, { price: 1 })).toThrow('name: Required');
    expect(() => validate(createProductSchema, { name: 'Mug', price: '100' })).toThrow(/^price: /);
  });
});

describe('user schemas', () => {
  const base = { email: ' Jane@Example.com ', password: 'longenough', firstName: 'Jane' };

  it('trims email and treats a blank phone as absent, null as clear', () => {
    const value = validate(createUserSchema, { ...base, lastName: 'Doe', phone: '   ' });
    expect(value).toEqual({ ...base, email: 'Jane@Example.com', lastName: 'Doe' });
    expect(validate(updateUserSchema, { phone: null })).toEqual({ phone: null });
  });

  it('rejects an invalid email, phone or role, naming the field', () => {
    expect(() => validate(createUserSchema, { ...base, lastName: 'D', email: 'nope' })).toThrow(
      /^email: /,
    );
    expect(() => validate(createUserSchema, { ...base, lastName: 'D', phone: '12ab' })).toThrow(
      'phone: must be 7-15 digits, optionally starting with +',
    );
    expect(() => validate(updateUserSchema, { role: 'SUPERUSER' })).toThrow(/^role: /);
  });

  it('requires at least one field on update, ignoring blanks', () => {
    expect(() => validate(updateUserSchema, {})).toThrow('Provide at least one field to update');
    expect(() => validate(updateUserSchema, { phone: '' })).toThrow(
      'Provide at least one field to update',
    );
  });
});

describe('generated API docs', () => {
  it('documents request bodies straight from the Zod schemas', () => {
    const { CreateUserInput, CreateProductInput } = openapi.components.schemas;
    expect(CreateUserInput).toMatchObject({
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: { email: { format: 'email' }, password: { minLength: 8, maxLength: 72 } },
    });
    expect(CreateProductInput).toMatchObject({
      required: ['name', 'price'],
      properties: { price: { type: 'integer', minimum: 0, maximum: 2_147_483_647 } },
    });
    // Unknown keys are stripped, not rejected, so the docs must not claim otherwise.
    expect(CreateUserInput).not.toHaveProperty('additionalProperties');
  });
});
