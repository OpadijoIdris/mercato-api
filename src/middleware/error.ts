import type { Request, Response, NextFunction } from 'express';
import ResponseService from '../util/response.js';

export default function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  ResponseService.resolveError(res, err);
}
