import type { Response } from 'express';
import AppError from './AppError.js';
import appLogger from './appLogger.js';

const SECRET_FIELDS = ['password'];

function strip(data: unknown): unknown {
  if (data && typeof data === 'object' && !Array.isArray(data) && !(data instanceof Date)) {
    const clone: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    for (const field of SECRET_FIELDS) delete clone[field];
    return clone;
  }
  return data;
}

function json(res: Response, statusCode: number, message: string, data: unknown = null): Response {
  const body = {
    status: statusCode > 299 ? 'failed' : 'success',
    message,
    data: data === null ? null : strip(data),
  };
  return res.status(statusCode).json(body);
}

// express.json() raises this when the request body is not valid JSON.
function isBodyParseError(err: unknown): boolean {
  return (err as { type?: string } | null)?.type === 'entity.parse.failed';
}

function resolveError(res: Response, err: unknown): Response {
  if (err instanceof AppError) {
    return json(res, err.statusCode, err.message, null);
  }
  if (isBodyParseError(err)) {
    return json(res, 400, 'Malformed JSON body', null);
  }
  appLogger.logRawError(err, 'unhandled');
  return json(res, 500, 'An error occurred', null);
}

export default { json, resolveError };
