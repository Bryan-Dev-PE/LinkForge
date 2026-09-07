import { createServer, type Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { disconnectPrisma, prisma } from './config/prisma';
import { logger } from './utils/logger';

const app = createApp();
const server: Server = createServer(app);

async function verifyDatabaseConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

async function start(): Promise<void> {
  try {
    await verifyDatabaseConnection();
  } catch (error) {
    logger.error('Could not connect to the database. Is PostgreSQL running?', error);
    process.exit(1);
  }

  server.listen(env.port, () => {
    logger.info(`LinkForge API listening on http://localhost:${env.port}`);
    logger.info(`Health check: GET /health`);
  });
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });

  setTimeout(() => {
    logger.warn('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void start();