import type { Request, Response, NextFunction } from 'express';
import appLogger from '../src/util/appLogger.js';
import type { AppRequest, AppResponse } from '../src/util/appLogger.js';

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

export function errorLogger(err: unknown, req: Request, _res: Response, next: NextFunction): void {
  appLogger.error(req as AppRequest, err);
  next(err);
}
