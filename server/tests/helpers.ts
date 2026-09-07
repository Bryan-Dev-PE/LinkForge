import request from 'supertest';
import type { Server } from 'node:http';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

export let server: Server;

export async function setupTestServer(): Promise<void> {
  const app = createApp();
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
}

export async function teardownTestServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
  await prisma.$disconnect();
}

export async function cleanDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "ClickEvent", "QrCode", "Link", "PasswordResetToken", "User" CASCADE',
  );
}

export interface TestUser {
  name: string;
  email: string;
  password: string;
  cookie: string[];
  userId: string;
}

export async function registerUser(name: string, email: string, password: string): Promise<TestUser> {
  const res = await request(server)
    .post('/api/auth/register')
    .send({ name, email, password, confirmPassword: password })
    .expect(201);

  const cookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  return {
    name,
    email: email.toLowerCase(),
    password,
    cookie: cookie ?? [],
    userId: res.body.data.user.id as string,
  };
}

export interface CreatedLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  expiresAt: string | null;
}

export async function createLinkFor(
  user: TestUser,
  originalUrl = 'https://example.com/portfolio',
  extra: Record<string, unknown> = {},
): Promise<CreatedLink> {
  const res = await request(server)
    .post('/api/links')
    .set('Cookie', user.cookie)
    .send({ originalUrl, ...extra })
    .expect(201);
  return res.body.data.link as CreatedLink;
}