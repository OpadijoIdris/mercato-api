// Prisma owns the table definition (database/postgres/schema.prisma). This module is the
// single place the rest of the product domain imports its shapes from, so no layer above the
// repository depends on the generated client directly.
import type { Product as ProductRow } from '../../database/generated/client.js';

export type Product = ProductRow;

// Input shapes are inferred from their Zod schemas (the single source of truth).
export type { CreateProductInput, ListProductsQuery } from '../schemas/ProductSchema.js';
