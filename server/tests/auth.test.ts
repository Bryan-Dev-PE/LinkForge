import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { cleanDatabase, registerUser, setupTestServer, teardownTestServer, server } from './helpers';

describe('Health endpoint', () => {
  beforeAll(async () => {
    await setupTestServer();
  });
  afterAll(async () => {
    await teardownTestServer();
  });

  it('returns ok', async () => {
    const res = await request(server).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestServer();
  });
  afterAll(async () => {
    await teardownTestServer();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('registers a user and sets an httpOnly cookie', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'secret12', confirmPassword: 'secret12' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('ada@example.com');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('linkforge_token='))).toBe(true);
      expect(cookies.some((c) => c.toLowerCase().includes('httponly'))).toBe(true);
    });

    it('rejects a duplicate email', async () => {
      const payload = { name: 'Ada', email: 'ada@example.com', password: 'secret12', confirmPassword: 'secret12' };
      await request(server).post('/api/auth/register').send(payload).expect(201);
      const res = await request(server).post('/api/auth/register').send(payload).expect(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    });

    it('rejects mismatched passwords', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ name: 'Grace', email: 'grace@example.com', password: 'secret12', confirmPassword: 'different' })
        .expect(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a weak password', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ name: 'Katherine', email: 'byte@example.com', password: 'shorty', confirmPassword: 'shorty' })
        .expect(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects an invalid email', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({ name: 'Linus', email: 'not-an-email', password: 'secret12', confirmPassword: 'secret12' })
        .expect(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await registerUser('Grace Hopper', 'grace@example.com', 'secret12');
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'grace@example.com', password: 'secret12' })
        .expect(200);
      expect(res.body.data.user.email).toBe('grace@example.com');
      expect((res.headers['set-cookie'] as unknown as string[]).some((c) => c.startsWith('linkforge_token='))).toBe(true);
    });

    it('rejects invalid credentials', async () => {
      await registerUser('Grace Hopper', 'grace@example.com', 'secret12');
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'grace@example.com', password: 'wrong-pass' })
        .expect(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the authenticated user', async () => {
      const user = await registerUser('Alan Turing', 'alan@example.com', 'secret12');
      const res = await request(server).get('/api/auth/me').set('Cookie', user.cookie).expect(200);
      expect(res.body.data.user.name).toBe('Alan Turing');
    });

    it('returns 401 without a session', async () => {
      const res = await request(server).get('/api/auth/me').expect(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the session cookie', async () => {
      const user = await registerUser('Margaret Hamilton', 'margaret@example.com', 'secret12');
      const res = await request(server).post('/api/auth/logout').set('Cookie', user.cookie).expect(200);
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes('linkforge_token='))).toBe(true);
    });
  });

  describe('Password reset flow', () => {
    it('does not leak whether an email exists', async () => {
      const res = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'ghost@example.com' })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetUrl).toBeUndefined();
    });

    it('returns a reset link in development and resets the password', async () => {
      const user = await registerUser('Barbara Liskov', 'barbara@example.com', 'secret12');
      const res = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'barbara@example.com' })
        .expect(200);
      const resetUrl = res.body.data.resetUrl as string | undefined;
      expect(resetUrl).toBeDefined();
      const token = new URL(resetUrl!).searchParams.get('token')!;

      await request(server)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newPass99' })
        .expect(200);

      const login = await request(server)
        .post('/api/auth/login')
        .send({ email: 'barbara@example.com', password: 'newPass99' })
        .expect(200);
      expect(login.body.data.user.id).toBe(user.userId);
    });

    it('rejects reusing an already-used token', async () => {
      await registerUser('Radia Perlman', 'radia@example.com', 'secret12');
      const res = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'radia@example.com' })
        .expect(200);
      const token = new URL(res.body.data.resetUrl as string).searchParams.get('token')!;

      await request(server)
        .post('/api/auth/reset-password')
        .send({ token, password: 'newPass99' })
        .expect(200);
      await request(server)
        .post('/api/auth/reset-password')
        .send({ token, password: 'another99' })
        .expect(400);
    });
  });
});