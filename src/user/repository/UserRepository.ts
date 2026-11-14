import prisma from '../../database/prisma.js';
import { withUniqueGuard } from '../../database/errors.js';
import type { Prisma } from '../../database/generated/client.js';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput, User } from '../models/User.js';

function buildWhere(filter: Pick<ListUsersQuery, 'role' | 'search'>): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (filter.role) where.role = filter.role;
  if (filter.search) {
    const contains = { contains: filter.search, mode: 'insensitive' as const };
    where.OR = [{ email: contains }, { firstName: contains }, { lastName: contains }];
  }
  return where;
}

const findById = (id: string): Promise<User | null> => prisma.user.findUnique({ where: { id } });

const findByEmail = (email: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { email } });

// Returns one page of users plus the total matching count, read in a single transaction.
async function list(query: ListUsersQuery): Promise<{ items: User[]; total: number }> {
  const where = buildWhere(query);
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

// Both throw UniqueConstraintError if the email is already taken (users_email_key).
const create = (values: CreateUserInput): Promise<User> =>
  withUniqueGuard(() => prisma.user.create({ data: values }));

const update = (id: string, values: UpdateUserInput): Promise<User> =>
  withUniqueGuard(() => prisma.user.update({ where: { id }, data: values }));

const remove = async (id: string): Promise<void> => {
  await prisma.user.delete({ where: { id } });
};

export default { findById, findByEmail, list, create, update, remove };
