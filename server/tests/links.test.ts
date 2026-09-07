import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  cleanDatabase,
  createLinkFor,
  registerUser,
  setupTestServer,
  teardownTestServer,
  server,
} from './helpers';

describe('Links API', () => {
  beforeAll(async () => {
    await setupTestServer();
  });
  afterAll(async () => {
    await teardownTestServer();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/links', () => {
    it('creates a short link for guests without an account', async () => {
      const res = await request(server)
        .post('/api/links')
        .send({ originalUrl: 'https://example.com/very/long/path?with=params&page=2' })
        .expect(201);

      expect(res.body.data.link.shortCode).toMatch(/^[a-zA-Z0-9]{6}$/);
      expect(res.body.data.link.shortUrl).toContain(`/${res.body.data.link.shortCode}`);
      expect(res.body.data.link.originalUrl).toBe('https://example.com/very/long/path?with=params&page=2');
      expect(res.body.data.link.userId).toBeNull();
      expect(res.body.data.link.expiresAt).not.toBeNull();
    });

    it('rejects javascript: URLs', async () => {
      const res = await request(server)
        .post('/api/links')
        .send({ originalUrl: 'javascript:alert(1)' })
        .expect(422);
      expect(res.body.error.code).toBe('INVALID_URL');
    });

    it('rejects ftp: and malformed URLs', async () => {
      await request(server).post('/api/links').send({ originalUrl: 'ftp://example.com/file' }).expect(422);
      await request(server).post('/api/links').send({ originalUrl: 'not a url' }).expect(422);
    });

    it('generates distinct short codes', async () => {
      const first = await request(server).post('/api/links').send({ originalUrl: 'https://a.example/1' }).expect(201);
      const second = await request(server).post('/api/links').send({ originalUrl: 'https://b.example/2' }).expect(201);
      expect(first.body.data.link.shortCode).not.toBe(second.body.data.link.shortCode);
    });

    it('allows authenticated users to set a custom alias', async () => {
      const user = await registerUser('Alonzo Church', 'church@example.com', 'secret12');
      const res = await request(server)
        .post('/api/links')
        .set('Cookie', user.cookie)
        .send({ originalUrl: 'https://lambda.example', customAlias: 'myLambda' })
        .expect(201);
      expect(res.body.data.link.customAlias).toBe('mylambda');
      expect(res.body.data.link.shortCode).toBe('mylambda');
    });

    it('rejects duplicate aliases with a clear error', async () => {
      const user = await registerUser('Alonzo Church', 'church@example.com', 'secret12');
      await createLinkFor(user, 'https://lambda.example', { customAlias: 'takencode' });
      const res = await request(server)
        .post('/api/links')
        .set('Cookie', user.cookie)
        .send({ originalUrl: 'https://other.example', customAlias: 'takencode' })
        .expect(409);
      expect(res.body.error.code).toBe('ALIAS_ALREADY_EXISTS');
    });

    it('rejects reserved aliases', async () => {
      const user = await registerUser('Alonzo Church', 'church@example.com', 'secret12');
      const res = await request(server)
        .post('/api/links')
        .set('Cookie', user.cookie)
        .send({ originalUrl: 'https://lambda.example', customAlias: 'dashboard' })
        .expect(409);
      expect(res.body.error.code).toBe('RESERVED_ALIAS');
    });

    it('rejects aliases with invalid characters or length', async () => {
      const user = await registerUser('Alonzo Church', 'church@example.com', 'secret12');
      await request(server)
        .post('/api/links')
        .set('Cookie', user.cookie)
        .send({ originalUrl: 'https://x.example', customAlias: 'a' })
        .expect(422);
      await request(server)
        .post('/api/links')
        .set('Cookie', user.cookie)
        .send({ originalUrl: 'https://x.example', customAlias: 'bad alias!' })
        .expect(422);
    });

    it('only allows custom aliases for authenticated users', async () => {
      const res = await request(server)
        .post('/api/links')
        .send({ originalUrl: 'https://guest.example', customAlias: 'guestalias' })
        .expect(403);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('respects expiration dates', async () => {
      const user = await registerUser('June Almeida', 'june@example.com', 'secret12');
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const link = await createLinkFor(user, 'https://expiring.example', { expiresAt: future });
      expect(link.expiresAt).toBeDefined();
      expect(new Date(link.expiresAt as unknown as string).getTime()).toBe(new Date(future).getTime());
    });
  });

  describe('GET /api/links', () => {
    it('lists only the authenticated user links', async () => {
      const user = await registerUser('Edsger Dijkstra', 'dijkstra@example.com', 'secret12');
      await createLinkFor(user, 'https://one.example');
      await createLinkFor(user, 'https://two.example');
      const other = await registerUser('Donald Knuth', 'knuth@example.com', 'secret12');
      await createLinkFor(other, 'https://other.example');

      const res = await request(server).get('/api/links').set('Cookie', user.cookie).expect(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.items.some((l: { originalUrl: string }) => l.originalUrl === 'https://other.example')).toBe(false);
    });

    it('returns 401 without authentication', async () => {
      await request(server).get('/api/links').expect(401);
    });

    it('supports search, filters, sorting, and pagination', async () => {
      const user = await registerUser('Barbara Liskov', 'biscuit@example.com', 'secret12');
      await createLinkFor(user, 'https://searchme.example', { title: 'portfolio' });
      await createLinkFor(user, 'https://other.example');
      for (let i = 0; i < 5; i += 1) {
        await createLinkFor(user, `https://batch${i}.example`);
      }

      const searched = await request(server).get('/api/links?search=searchme').set('Cookie', user.cookie).expect(200);
      expect(searched.body.data.total).toBe(1);

      const paged = await request(server).get('/api/links?page=1&limit=3').set('Cookie', user.cookie).expect(200);
      expect(paged.body.data.items.length).toBe(3);
      expect(paged.body.data.totalPages).toBe(3);

      const sorted = await request(server)
        .get('/api/links?sortBy=createdAt&order=asc')
        .set('Cookie', user.cookie)
        .expect(200);
      const titles = sorted.body.data.items.map((l: { title: string | null }) => l.title);
      expect(titles[0]).toBe('portfolio');
    });
  });

  describe('GET /api/links/:id', () => {
    it('returns a single link with its click count', async () => {
      const user = await registerUser('Alan Kay', 'kay@example.com', 'secret12');
      const created = await createLinkFor(user, 'https://detail.example');
      const res = await request(server).get(`/api/links/${created.id}`).set('Cookie', user.cookie).expect(200);
      expect(res.body.data.link.id).toBe(created.id);
      expect(res.body.data.link.clickCount).toBe(0);
    });

    it('returns 404 for another users link', async () => {
      const owner = await registerUser('Owner', 'owner@example.com', 'secret12');
      const link = await createLinkFor(owner, 'https://private.example');
      const intruder = await registerUser('Intruder', 'intruder@example.com', 'secret12');
      await request(server).get(`/api/links/${link.id}`).set('Cookie', intruder.cookie).expect(404);
    });
  });

  describe('PATCH-like updates and status', () => {
    it('updates destination, title, and expiration', async () => {
      const user = await registerUser('Grace Hopper', 'gh@example.com', 'secret12');
      const created = await createLinkFor(user, 'https://old.example');
      const res = await request(server)
        .put(`/api/links/${created.id}`)
        .set('Cookie', user.cookie)
        .send({ originalUrl: 'https://new.example', title: 'Updated title' })
        .expect(200);
      expect(res.body.data.link.originalUrl).toBe('https://new.example');
      expect(res.body.data.link.title).toBe('Updated title');
    });

    it('prevents hijacking an existing alias on update', async () => {
      const user = await registerUser('Grace Hopper', 'gh@example.com', 'secret12');
      await createLinkFor(user, 'https://a.example', { customAlias: 'stable' });
      const second = await createLinkFor(user, 'https://b.example');
      const res = await request(server)
        .put(`/api/links/${second.id}`)
        .set('Cookie', user.cookie)
        .send({ customAlias: 'stable' })
        .expect(409);
      expect(res.body.error.code).toBe('ALIAS_ALREADY_EXISTS');
    });

    it('disables and re-enables a link', async () => {
      const user = await registerUser('Grace Hopper', 'gh@example.com', 'secret12');
      const created = await createLinkFor(user, 'https://toggle.example');
      const disabled = await request(server)
        .post(`/api/links/${created.id}/disable`)
        .set('Cookie', user.cookie)
        .expect(200);
      expect(disabled.body.data.link.status).toBe('DISABLED');
      const enabled = await request(server)
        .post(`/api/links/${created.id}/enable`)
        .set('Cookie', user.cookie)
        .expect(200);
      expect(enabled.body.data.link.status).toBe('ACTIVE');
    });
  });

  describe('DELETE /api/links/:id', () => {
    it('deletes a link the user owns', async () => {
      const user = await registerUser('Grace Hopper', 'gh@example.com', 'secret12');
      const created = await createLinkFor(user, 'https://delete.example');
      await request(server).delete(`/api/links/${created.id}`).set('Cookie', user.cookie).expect(200);
      await request(server).get(`/api/links/${created.id}`).set('Cookie', user.cookie).expect(404);
    });
  });
});