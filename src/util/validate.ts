import type { ObjectSchema } from 'joi';
import AppError from './AppError.js';

export function validate<T>(schema: ObjectSchema<T>, payload: unknown): T {
  const { value, error } = schema.validate(payload, { stripUnknown: true });
  if (error) throw new AppError(400, error.details[0]?.message ?? 'Invalid request');
  return value as T;
}
