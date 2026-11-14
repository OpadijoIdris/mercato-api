import prisma from '../../database/postgres/prisma.js';

export async function resetTestDb(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "products", "users" RESTART IDENTITY CASCADE');
}
