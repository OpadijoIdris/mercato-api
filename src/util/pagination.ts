import { z } from 'zod';

// Shared by every list endpoint so they all page, validate and respond the same way.

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Spread into a list endpoint's query schema: z.object({ ...pageQueryShape, search: ... }).
// Query strings are always strings, so these coerce ("2" -> 2).
export const pageQueryShape = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

export type PageQuery = z.infer<z.ZodObject<typeof pageQueryShape>>;

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Prisma `skip`/`take` for a page.
export const toSkipTake = ({ page, limit }: PageQuery): { skip: number; take: number } => ({
  skip: (page - 1) * limit,
  take: limit,
});

export function paginate<T>(items: T[], total: number, { page, limit }: PageQuery): Paginated<T> {
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
