import type { Request, Response, NextFunction } from 'express';
import appLogger from '../util/appLogger.js';
import type { AppRequest, AppResponse } from '../util/appLogger.js';
import ResponseService from '../util/response.js';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  appLogger.withRequestContext(req);
  appLogger.request(req as AppRequest);
  next();
}

export function responseLogger(_req: Request, res: Response, next: NextFunction): void {
  let responseBody: unknown;

  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    appLogger.response(res as AppResponse, res.statusCode, responseBody);
  });

  next();
}

// Logs unexpected failures (5xx) with full request context. Expected outcomes such as a 404 or a
// validation 400 are already visible in the response log, so they are not logged as errors.
export function errorLogger(err: unknown, req: Request, _res: Response, next: NextFunction): void {
  if (ResponseService.statusOf(err) >= 500) {
    appLogger.error(req as AppRequest, err, 'unhandled');
  }
  next(err);
}
