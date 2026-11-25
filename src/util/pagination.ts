import Joi from 'joi';

// Shared by every list endpoint so they all page, validate and respond the same way.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PageQuery {
  page: number;
  limit: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Spread into a list endpoint's Joi query schema: Joi.object({ ...pageQueryFields, search: ... }).
export const pageQueryFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

// Prisma `skip`/`take` for a page.
export const toSkipTake = ({ page, limit }: PageQuery): { skip: number; take: number } => ({
  skip: (page - 1) * limit,
  take: limit,
});

export function paginate<T>(items: T[], total: number, { page, limit }: PageQuery): Paginated<T> {
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
