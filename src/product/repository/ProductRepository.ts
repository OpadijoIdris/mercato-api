import prisma from '../../../database/postgres/prisma.js';
import type { CreateProductInput, Product } from '../models/Product.js';

const findById = (id: string): Promise<Product | null> =>
  prisma.product.findUnique({ where: { id } });

const listAll = (): Promise<Product[]> =>
  prisma.product.findMany({ orderBy: { createdAt: 'desc' } });

const create = (values: CreateProductInput): Promise<Product> =>
  prisma.product.create({ data: values });

export default { findById, listAll, create };
