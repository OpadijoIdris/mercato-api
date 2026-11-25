import { z } from 'zod';
import AppError from './AppError.js';

// A missing required field reads "name: Required" instead of
// "name: Invalid input: expected string, received undefined".
z.config({
  customError: (issue) =>
    issue.code === 'invalid_type' && issue.input === undefined ? 'Required' : undefined,
});

type Issue = z.ZodError['issues'][number];

function formatIssue(issue: Issue | undefined): string {
  if (!issue) return 'Invalid request';
  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

// Parses at the edge: returns the typed, cleaned value (unknown keys stripped, defaults applied)
// or throws a 400 describing the first problem.
export function validate<S extends z.ZodType>(schema: S, payload: unknown): z.output<S> {
  const result = schema.safeParse(payload);
  if (!result.success) throw new AppError(400, formatIssue(result.error.issues[0]));
  return result.data;
}

// An optional text field where a blank string ('' or whitespace) means "not provided" and null
// means "clear it". The blank check runs before `schema`, so e.g. a phone pattern never sees ''.
export function optionalText<S extends z.ZodType<string>>(schema: S) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.nullable().optional(),
  );
}
