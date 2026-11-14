import type { Request, Response } from 'express';
import ResponseService from '../../util/response.js';
import { validate } from '../../util/validate.js';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from '../schemas/UserSchema.js';
import UserService from '../services/UserService.js';

async function list(req: Request, res: Response): Promise<Response> {
  try {
    const query = validate(listUsersQuerySchema, req.query);
    const result = await UserService.list(query);
    return ResponseService.json(res, 200, 'Users', result);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

async function getOne(req: Request<{ id: string }>, res: Response): Promise<Response> {
  try {
    const user = await UserService.getById(req.params.id);
    return ResponseService.json(res, 200, 'User', user);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

async function create(req: Request, res: Response): Promise<Response> {
  try {
    const input = validate(createUserSchema, req.body ?? {});
    const user = await UserService.create(input);
    return ResponseService.json(res, 201, 'User created', user);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

async function update(req: Request<{ id: string }>, res: Response): Promise<Response> {
  try {
    const input = validate(updateUserSchema, req.body ?? {});
    const user = await UserService.update(req.params.id, input);
    return ResponseService.json(res, 200, 'User updated', user);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

async function remove(req: Request<{ id: string }>, res: Response): Promise<Response> {
  try {
    await UserService.remove(req.params.id);
    return ResponseService.json(res, 200, 'User deleted', null);
  } catch (e) {
    return ResponseService.resolveError(res, e);
  }
}

export default { list, getOne, create, update, remove };
