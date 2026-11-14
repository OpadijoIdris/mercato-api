import Joi from 'joi';
import { pageQueryFields } from '../../util/pagination.js';
import type { CreateProductInput, ListProductsQuery } from '../models/Product.js';

// Numbers are strict so "100" (a string) is rejected rather than silently coerced.
export const createProductSchema = Joi.object<CreateProductInput>({
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(5000).empty('').allow(null).optional(),
  price: Joi.number().integer().min(0).strict().required(),
  stock: Joi.number().integer().min(0).strict().optional(),
});

// Query strings are always strings, so numbers here are coerced (not strict).
export const listProductsQuerySchema = Joi.object<ListProductsQuery>({
  ...pageQueryFields,
  search: Joi.string().trim().max(100).empty(''),
});
