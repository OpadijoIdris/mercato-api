import { randomUUID } from 'node:crypto';
import winston from 'winston';
import type { Request, Response } from 'express';
import config from '../../config/env.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppRequest extends Request {
  tag?: string;
  _startTime?: Date;
}

interface AppResponse extends Response {
  req: AppRequest;
}

interface LogPayload {
  service: string;
  type: 'request' | 'response' | 'error' | 'info';
  created: Date;
  age: number;
  endpoint: string;
  tag: string;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// winston (console) logger
// ---------------------------------------------------------------------------

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console({ silent: config.env === 'test' })],
});

// ---------------------------------------------------------------------------
// Masking
// ---------------------------------------------------------------------------

// Fields that must never be written to logs in clear text (matched case-insensitively).
const MASKED_FIELDS = ['authorization', 'password', 'pin', 'apikey', 'secret', 'token', 'cookie'];

function maskSecureFields(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const masked: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(masked)) {
    const value = masked[key];
    if (MASKED_FIELDS.includes(key.toLowerCase()) && value) {
      const str = String(value);
      const keep = Math.min(4, Math.floor(str.length / 4));
      masked[key] = `${str.substring(0, keep)}****${str.substring(str.length - keep)}`;
    }
  }
  return masked;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  return req.socket.remoteAddress;
}

function build(
  req: AppRequest,
  type: LogPayload['type'],
  payload: Record<string, unknown>,
): LogPayload {
  const startTime = req._startTime ?? new Date();
  return {
    service: 'api',
    type,
    created: type === 'response' ? new Date() : startTime,
    age: Date.now() - startTime.getTime(),
    endpoint: req.originalUrl || req.url,
    tag: req.tag ?? '',
    payload: { verb: req.method, client: clientIp(req), ...payload },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Attach a correlation tag + start time so request/response/error events can be joined by `tag`.
function withRequestContext(req: Request): AppRequest {
  const r = req as AppRequest;
  if (!r.tag) r.tag = randomUUID();
  if (!r._startTime) r._startTime = new Date();
  return r;
}

function request(req: AppRequest): void {
  if (!req.tag) return;
  logger.info(
    build(req, 'request', {
      headers: maskSecureFields(req.headers),
      query: maskSecureFields(req.query),
      body: maskSecureFields(req.body),
    }),
  );
}

function response(res: AppResponse, responseCode: number, body: unknown): void {
  if (!res.req?.tag) return;
  const level = responseCode >= 500 ? 'error' : responseCode >= 400 ? 'warn' : 'info';
  logger.log(level, build(res.req, 'response', { responseCode, body }));
}

function error(req: AppRequest, err: unknown, classification?: string): void {
  if (!req.tag || !(err instanceof Error)) return;
  logger.error(
    build(req, 'error', {
      query: maskSecureFields(req.query),
      requestBody: maskSecureFields(req.body),
      classification: classification ?? err.name,
      body: { message: err.message, source: err.name, description: err.stack },
    }),
  );
}

function info(req: AppRequest, data: unknown, classification?: string): void {
  if (!req.tag) return;
  logger.info(build(req, 'info', { classification, body: data }));
}

// For errors raised outside a request context (or swallowed by a controller).
function logRawError(e: unknown, classification?: string, context?: Record<string, unknown>): void {
  const err = e as { message?: string; name?: string; stack?: string };
  logger.error({
    service: 'api',
    type: 'error',
    created: new Date(),
    payload: { message: err?.message, name: err?.name, stack: err?.stack, classification, context },
  });
}

const appLogger = { withRequestContext, request, response, error, info, logRawError };

export { withRequestContext, request, response, error, info, logRawError };
export type { AppRequest, AppResponse, LogPayload };
export default appLogger;
