import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/config/prisma';
import {
  cleanDatabase,
  createLinkFor,
  registerUser,
  setupTestServer,
  teardownTestServer,
  server,
} from './helpers';

describe('Redirect behavior', () => {
  beforeAll(async () => {
    await setupTestServer();
  });
  afterAll(async () => {
    await teardownTestServer();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('redirects an active link to its destination', async () => {
    const user = await registerUser('Tim Cook', 'cook@example.com', 'secret12');
    const created = await createLinkFor(user, 'https://destination.example/landing');
    const res = await request(server).get(`/${created.shortCode}`).redirects(0).expect(302);
    expect(res.headers.location).toBe('https://destination.example/landing');
  });

  it('records analytic events on redirect', async () => {
    const user = await registerUser('Tim Cook', 'cook@example.com', 'secret12');
    const created = await createLinkFor(user, 'https://destination.example/landing');

    await request(server)
      .get(`/${created.shortCode}`)
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')
      .set('Referer', 'https://twitter.com/')
      .redirects(0)
      .expect(302);
    await request(server).get(`/${created.shortCode}`).redirects(0).expect(302);

    const events = await prisma.clickEvent.findMany({ where: { linkId: created.id } });
    expect(events.length).toBe(2);
    expect(events[0]?.deviceType).toBe('desktop');
    expect(events[0]?.browser).toContain('Chrome');
    expect(events[0]?.operatingSystem).toBe('Windows');
    expect(events[0]?.referrer).toBe('twitter.com');
    expect(events[0]?.anonymizedIp).toBeDefined();
    expect(events[0]?.anonymizedIp).not.toMatch(/[^a-f0-9]/);
  });

  it('redirects a custom alias case-insensitively', async () => {
    const user = await registerUser('Tim Cook', 'cook@example.com', 'secret12');
    await createLinkFor(user, 'https://alias-destination.example', { customAlias: 'MyProjects' });
    const res = await request(server).get('/myprojects').redirects(0).expect(302);
    expect(res.headers.location).toBe('https://alias-destination.example');
  });

  it('returns 404 for unknown short codes', async () => {
    const res = await request(server).get('/notexist').expect(404);
    expect(res.text).toContain('Link not found');
  });

  it('does not redirect a disabled link', async () => {
    const user = await registerUser('Tim Cook', 'cook@example.com', 'secret12');
    const created = await createLinkFor(user, 'https://hidden.example');
    await request(server).post(`/api/links/${created.id}/disable`).set('Cookie', user.cookie).expect(200);
    const res = await request(server).get(`/${created.shortCode}`).redirects(0).expect(423);
    expect(res.text).toContain('disabled');
  });

  it('does not redirect an expired link', async () => {
    const user = await registerUser('Tim Cook', 'cook@example.com', 'secret12');
    const created = await createLinkFor(user, 'https://expired.example');
    await prisma.link.update({
      where: { id: created.id },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) },
    });

    const res = await request(server).get(`/${created.shortCode}`).redirects(0).expect(410);
    expect(res.text).toContain('expired');

    const updated = await prisma.link.findUnique({ where: { id: created.id } });
    expect(updated?.status).toBe('EXPIRED');
  });

  it('redirects guest-created links', async () => {
    const res = await request(server)
      .post('/api/links')
      .send({ originalUrl: 'https://guest-destination.example' })
      .expect(201);
    const code = res.body.data.link.shortCode as string;
    await request(server).get(`/${code}`).redirects(0).expect(302);
  });
});