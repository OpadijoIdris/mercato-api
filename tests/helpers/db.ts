import prisma from '../../src/database/prisma.js';

export async function resetTestDb(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "products", "users" RESTART IDENTITY CASCADE');
}
