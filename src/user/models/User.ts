// Prisma owns the table definition (database/postgres/schema.prisma). The rest of the user
// domain imports its shapes from here instead of from the generated client.
import type { User as UserRow } from '../../database/generated/client.js';
import type { PageQuery } from '../../util/pagination.js';
import type { Role } from '../constants/Roles.js';

// What queries return by default: the password hash is omitted at the client level.
export type User = Omit<UserRow, 'password'>;

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: Role;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>>;

export interface ListUsersQuery extends PageQuery {
  role?: Role;
  // Case-insensitive match against email, first name and last name.
  search?: string;
}
