import ProductRepository from '../repository/ProductRepository.js';
import AppError from '../../util/AppError.js';
import type { CreateProductInput, Product } from '../models/Product.js';

async function listAll(): Promise<Product[]> {
  return ProductRepository.listAll();
}

async function getById(id: string): Promise<Product> {
  const product = await ProductRepository.findById(id);
  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

async function create(input: CreateProductInput): Promise<Product> {
  return ProductRepository.create({
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    stock: input.stock ?? 0,
  });
}

export default { listAll, getById, create };
