import type { Request, Response } from 'express';
import ResponseService from '../../util/response.js';
import { validate } from '../../util/validate.js';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from '../schemas/UserSchema.js';
import UserService from '../services/UserService.js';

// Errors are thrown, not caught: Express 5 forwards a rejected handler to the error middleware.

async function list(req: Request, res: Response): Promise<void> {
  const query = validate(listUsersQuerySchema, req.query);
  const result = await UserService.list(query);
  ResponseService.json(res, 200, 'Users', result);
}

async function getOne(req: Request<{ id: string }>, res: Response): Promise<void> {
  const user = await UserService.getById(req.params.id);
  ResponseService.json(res, 200, 'User', user);
}

async function create(req: Request, res: Response): Promise<void> {
  const input = validate(createUserSchema, req.body ?? {});
  const user = await UserService.create(input);
  ResponseService.json(res, 201, 'User created', user);
}

async function update(req: Request<{ id: string }>, res: Response): Promise<void> {
  const input = validate(updateUserSchema, req.body ?? {});
  const user = await UserService.update(req.params.id, input);
  ResponseService.json(res, 200, 'User updated', user);
}

async function remove(req: Request<{ id: string }>, res: Response): Promise<void> {
  await UserService.remove(req.params.id);
  ResponseService.json(res, 200, 'User deleted', null);
}

export default { list, getOne, create, update, remove };
