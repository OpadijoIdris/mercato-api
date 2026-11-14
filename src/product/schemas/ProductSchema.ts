import Joi from 'joi';
import type { CreateProductInput } from '../models/Product.js';

// Numbers are strict so "100" (a string) is rejected rather than silently coerced.
export const createProductSchema = Joi.object<CreateProductInput>({
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(5000).empty('').allow(null).optional(),
  price: Joi.number().integer().min(0).strict().required(),
  stock: Joi.number().integer().min(0).strict().optional(),
});
