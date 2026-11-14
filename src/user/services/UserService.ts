import UserRepository from '../repository/UserRepository.js';
import { UniqueConstraintError } from '../../../database/postgres/errors.js';
import AppError from '../../util/AppError.js';
import passwordUtil from '../../util/password.js';
import type {
  CreateUserInput,
  ListUsersQuery,
  Paginated,
  UpdateUserInput,
  User,
} from '../models/User.js';

const EMAIL_TAKEN = 'A user with this email already exists';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// Fast path: a clear 409 in the common case without attempting the write.
async function assertEmailAvailable(email: string, exceptUserId?: string): Promise<void> {
  const existing = await UserRepository.findByEmail(email);
  if (existing && existing.id !== exceptUserId) {
    throw new AppError(409, EMAIL_TAKEN);
  }
}

// Atomic path: the unique index on users.email is the real guarantee. If a concurrent request
// claims the email between assertEmailAvailable and the write, the write itself fails with
// UniqueConstraintError, and the caller still gets a 409 instead of a 500.
async function guardEmailConflict<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (e) {
    if (e instanceof UniqueConstraintError) throw new AppError(409, EMAIL_TAKEN);
    throw e;
  }
}

async function list(query: ListUsersQuery): Promise<Paginated<User>> {
  const { items, total } = await UserRepository.list(query);
  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

async function getById(id: string): Promise<User> {
  const user = await UserRepository.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function create(input: CreateUserInput): Promise<User> {
  const email = normalizeEmail(input.email);
  await assertEmailAvailable(email);
  const password = await passwordUtil.hash(input.password);
  return guardEmailConflict(() => UserRepository.create({ ...input, email, password }));
}

async function update(id: string, input: UpdateUserInput): Promise<User> {
  await getById(id);
  const values: UpdateUserInput = { ...input };
  if (input.email !== undefined) {
    values.email = normalizeEmail(input.email);
    await assertEmailAvailable(values.email, id);
  }
  return guardEmailConflict(() => UserRepository.update(id, values));
}

async function remove(id: string): Promise<void> {
  await getById(id);
  await UserRepository.remove(id);
}

export default { list, getById, create, update, remove };
