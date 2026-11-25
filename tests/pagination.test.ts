import Joi from 'joi';
import { describe, expect, it } from 'vitest';
import { paginate, pageQueryFields, toSkipTake } from '../src/util/pagination.js';

describe('pagination helpers', () => {
  it('converts a page into Prisma skip/take', () => {
    expect(toSkipTake({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
    expect(toSkipTake({ page: 3, limit: 10 })).toEqual({ skip: 20, take: 10 });
  });

  it('builds the paginated response shape, rounding totalPages up', () => {
    expect(paginate(['a'], 21, { page: 2, limit: 10 })).toEqual({
      items: ['a'],
      pagination: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
    expect(paginate([], 0, { page: 1, limit: 10 }).pagination.totalPages).toBe(0);
  });

  it('defaults page/limit and coerces query-string numbers', () => {
    const schema = Joi.object(pageQueryFields);
    expect(schema.validate({}).value).toEqual({ page: 1, limit: 20 });
    expect(schema.validate({ page: '2', limit: '5' }).value).toEqual({ page: 2, limit: 5 });
    expect(schema.validate({ limit: '101' }).error).toBeDefined();
  });
});
