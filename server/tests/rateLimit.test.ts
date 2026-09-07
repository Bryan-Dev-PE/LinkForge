import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  cleanDatabase,
  setupTestServer,
  teardownTestServer,
  server,
} from './helpers';

describe('Guest link rate limiting', () => {
  beforeAll(async () => {
    await setupTestServer();
  });
  afterAll(async () => {
    await teardownTestServer();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('blocks guests after the configured hourly limit', async () => {
    for (let i = 0; i < 10; i += 1) {
      const res = await request(server)
        .post('/api/links')
        .send({ originalUrl: `https://guest${i}.example` });
      if (res.status !== 201) {
        throw new Error(`Unexpected status ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }

    const res = await request(server)
      .post('/api/links')
      .send({ originalUrl: 'https://guest10.example' })
      .expect(429);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});