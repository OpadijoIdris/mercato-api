// Prisma owns the table definition (database/postgres/schema.prisma). The rest of the user
// domain imports its shapes from here instead of from the generated client.
import type { User as UserRow } from '../../database/generated/client.js';

// What queries return by default: the password hash is omitted at the client level.
export type User = Omit<UserRow, 'password'>;

// Input shapes are inferred from their Zod schemas (the single source of truth).
export type { CreateUserInput, ListUsersQuery, UpdateUserInput } from '../schemas/UserSchema.js';
