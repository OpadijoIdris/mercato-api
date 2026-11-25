import { z } from 'zod';
import { pageQueryShape } from '../../util/pagination.js';
import { optionalText } from '../../util/validate.js';

// Each schema is the single source of truth for its shape: the TypeScript type is inferred from
// it, so validation and types can't drift apart.

// price and stock are Postgres INTEGER columns; anything larger would fail in the database.
const PG_INT_MAX = 2_147_483_647;

// Body numbers are not coerced, so "100" (a string) is rejected rather than silently converted.
export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(255).meta({ example: 'Classic T-shirt' }),
  description: optionalText(z.string().trim().max(5000)),
  // Smallest currency unit (kobo, cents) to avoid floating point errors.
  price: z
    .number()
    .int()
    .min(0)
    .max(PG_INT_MAX)
    .meta({ description: 'Smallest currency unit (500000 kobo = NGN 5,000)', example: 500000 }),
  stock: z.number().int().min(0).max(PG_INT_MAX).optional().meta({ example: 25 }),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const listProductsQuerySchema = z.object({
  ...pageQueryShape,
  // Case-insensitive match against the product name.
  search: optionalText(z.string().trim().max(100)),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
