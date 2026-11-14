import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import AppError from '../src/util/AppError.js';
import ResponseService from '../src/util/response.js';

function mockRes() {
  const res = {
    status: vi.fn<(code: number) => unknown>(),
    json: vi.fn<(body: unknown) => unknown>(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response & typeof res;
}

describe('ResponseService', () => {
  it('wraps data in the success envelope and strips passwords', () => {
    const res = mockRes();
    ResponseService.json(res, 200, 'ok', { id: 1, password: 'secret' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'success', message: 'ok', data: { id: 1 } });
  });

  it('marks >299 responses as failed', () => {
    const res = mockRes();
    ResponseService.json(res, 400, 'bad');
    expect(res.json).toHaveBeenCalledWith({ status: 'failed', message: 'bad', data: null });
  });

  it('maps AppError to its status code and hides unknown errors behind a 500', () => {
    const res = mockRes();
    ResponseService.resolveError(res, new AppError(404, 'Product not found'));
    expect(res.status).toHaveBeenCalledWith(404);

    const res2 = mockRes();
    ResponseService.resolveError(res2, new Error('db exploded'));
    expect(res2.status).toHaveBeenCalledWith(500);
    expect(res2.json).toHaveBeenCalledWith({
      status: 'failed',
      message: 'An error occurred',
      data: null,
    });
  });

  it('statusOf maps AppError, Express 4xx errors and unknown errors', () => {
    expect(ResponseService.statusOf(new AppError(404, 'x'))).toBe(404);
    expect(ResponseService.statusOf(Object.assign(new Error('too big'), { status: 413 }))).toBe(
      413,
    );
    expect(ResponseService.statusOf(Object.assign(new Error('boom'), { status: 503 }))).toBe(500);
    expect(ResponseService.statusOf(new Error('boom'))).toBe(500);
    expect(ResponseService.statusOf('not even an error')).toBe(500);
  });
});
