import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (envIsNotProduction()) {
  globalForPrisma.prisma = prisma;
}

function envIsNotProduction(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}