import type { Request, Response } from 'express';
import ResponseService from '../../util/response.js';
import { validate } from '../../util/validate.js';
import { createProductSchema, listProductsQuerySchema } from '../schemas/ProductSchema.js';
import ProductService from '../services/ProductService.js';

// Errors are thrown, not caught: Express 5 forwards a rejected handler to the error middleware.

async function list(req: Request, res: Response): Promise<void> {
  const query = validate(listProductsQuerySchema, req.query);
  const result = await ProductService.list(query);
  ResponseService.json(res, 200, 'Products', result);
}

async function getOne(req: Request<{ id: string }>, res: Response): Promise<void> {
  const product = await ProductService.getById(req.params.id);
  ResponseService.json(res, 200, 'Product', product);
}

async function create(req: Request, res: Response): Promise<void> {
  const input = validate(createProductSchema, req.body ?? {});
  const product = await ProductService.create(input);
  ResponseService.json(res, 201, 'Product created', product);
}

export default { list, getOne, create };
