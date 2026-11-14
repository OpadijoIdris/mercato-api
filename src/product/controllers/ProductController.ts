import type { Request, Response } from 'express';
import ResponseService from '../../util/response.js';
import { validate } from '../../util/validate.js';
import { createProductSchema } from '../schemas/ProductSchema.js';
import ProductService from '../services/ProductService.js';

async function list(_req: Request, res: Response): Promise<Response> {
  try {
    const products = await ProductService.listAll();
    return ResponseService.json(res, 200, 'Products', products);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

async function getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
  try {
    const product = await ProductService.getById(req.params.id);
    return ResponseService.json(res, 200, 'Product', product);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

async function create(req: Request, res: Response): Promise<Response> {
  try {
    const input = validate(createProductSchema, req.body ?? {});
    const product = await ProductService.create(input);
    return ResponseService.json(res, 201, 'Product created', product);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

export default { list, getOne, create };
