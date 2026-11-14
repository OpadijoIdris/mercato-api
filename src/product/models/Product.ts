// Prisma owns the table definition (database/postgres/schema.prisma). This module is the
// single place the rest of the product domain imports its row and input shapes from, so no
// layer above the repository depends on the generated client directly.
import type { Product as ProductRow } from '../../../database/postgres/generated/client.js';

export type Product = ProductRow;

export interface CreateProductInput {
  name: string;
  description?: string | null;
  // Smallest currency unit (kobo, cents) to avoid floating point errors.
  price: number;
  stock?: number;
}
