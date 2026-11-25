import type { Response } from 'express';
import AppError from './AppError.js';

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

// Errors raised by Express itself and its body parser (http-errors): a 4xx status plus a message
// that is safe to show the client (`expose`). E.g. invalid JSON, payload too large.
interface HttpError {
  status: number;
  expose?: boolean;
  type?: string;
  message: string;
}

function isClientHttpError(err: unknown): err is HttpError {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

// The HTTP status an error maps to. Anything unrecognised is a 500.
function statusOf(err: unknown): number {
  if (err instanceof AppError) return err.statusCode;
  if (isClientHttpError(err)) return err.status;
  return 500;
}

function resolveError(res: Response, err: unknown): Response {
  if (err instanceof AppError) {
    return json(res, err.statusCode, err.message, null);
  }
  if (isClientHttpError(err)) {
    const message =
      err.type === 'entity.parse.failed'
        ? 'Malformed JSON body'
        : err.expose
          ? err.message
          : 'Bad request';
    return json(res, err.status, message, null);
  }
  // Never leak internal details; the error middleware has already logged it.
  return json(res, 500, 'An error occurred', null);
}

export default { json, resolveError, statusOf };
