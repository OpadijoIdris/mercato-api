import prisma from '../../database/prisma.js';
import type { Prisma } from '../../database/generated/client.js';
import { toSkipTake } from '../../util/pagination.js';
import type { CreateProductInput, ListProductsQuery, Product } from '../models/Product.js';

function buildWhere(filter: Pick<ListProductsQuery, 'search'>): Prisma.ProductWhereInput {
  return filter.search ? { name: { contains: filter.search, mode: 'insensitive' } } : {};
}

const findById = (id: string): Promise<Product | null> =>
  prisma.product.findUnique({ where: { id } });

// Returns one page of products plus the total matching count, read in a single transaction.
async function list(query: ListProductsQuery): Promise<{ items: Product[]; total: number }> {
  const where = buildWhere(query);
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      ...toSkipTake(query),
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total };
}

const create = (values: CreateProductInput): Promise<Product> =>
  prisma.product.create({ data: values });

export default { findById, list, create };
