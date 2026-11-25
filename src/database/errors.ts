import { Prisma } from './generated/client.js';

// Raised by repositories when an insert/update hits a unique constraint. Database-level, so
// repositories stay free of HTTP concerns; services decide what it means (usually a 409).
export class UniqueConstraintError extends Error {
  constructor(cause: unknown) {
    super('Unique constraint violation', { cause });
    this.name = 'UniqueConstraintError';
  }
}

// P2002 = "Unique constraint failed". This is the database's atomic guarantee: it still fires
// when two concurrent requests both pass an application-level "is this taken?" check.
export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

// Run a write, translating a unique violation into UniqueConstraintError.
export async function withUniqueGuard<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (e) {
    if (isUniqueViolation(e)) throw new UniqueConstraintError(e);
    throw e;
  }
}
