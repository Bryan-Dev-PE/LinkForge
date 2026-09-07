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

describe('QR configuration API', () => {
  beforeAll(async () => {
    await setupTestServer();
  });
  afterAll(async () => {
    await teardownTestServer();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns defaults before any customization', async () => {
    const user = await registerUser('Ada Lovelace', 'qr-ada@example.com', 'secret12');
    const link = await createLinkFor(user, 'https://qr.example');
    const res = await request(server).get(`/api/links/${link.id}/qr`).set('Cookie', user.cookie).expect(200);
    expect(res.body.data.settings).toEqual({
      foregroundColor: '#000000',
      backgroundColor: '#FFFFFF',
      size: 512,
      margin: 4,
      logoUrl: null,
    });
  });

  it('saves and returns customized settings', async () => {
    const user = await registerUser('Ada Lovelace', 'qr-ada@example.com', 'secret12');
    const link = await createLinkFor(user, 'https://qr.example');
    const res = await request(server)
      .post(`/api/links/${link.id}/qr`)
      .set('Cookie', user.cookie)
      .send({ foregroundColor: '#FF0000', backgroundColor: '#0000FF', size: 768, margin: 2, logoUrl: null })
      .expect(200);
    expect(res.body.data.settings.foregroundColor).toBe('#FF0000');
    expect(res.body.data.settings.size).toBe(768);

    const fetched = await request(server).get(`/api/links/${link.id}/qr`).set('Cookie', user.cookie).expect(200);
    expect(fetched.body.data.settings.backgroundColor).toBe('#0000FF');
  });

  it('rejects invalid colors', async () => {
    const user = await registerUser('Ada Lovelace', 'qr-ada@example.com', 'secret12');
    const link = await createLinkFor(user, 'https://qr.example');
    const res = await request(server)
      .post(`/api/links/${link.id}/qr`)
      .set('Cookie', user.cookie)
      .send({ foregroundColor: 'red', backgroundColor: '#FFFFFF', size: 512, margin: 4 })
      .expect(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('clamps out-of-range sizes', async () => {
    const user = await registerUser('Ada Lovelace', 'qr-ada@example.com', 'secret12');
    const link = await createLinkFor(user, 'https://qr.example');
    const res = await request(server)
      .post(`/api/links/${link.id}/qr`)
      .set('Cookie', user.cookie)
      .send({ foregroundColor: '#000000', backgroundColor: '#FFFFFF', size: 99999, margin: 999 })
      .expect(200);
    expect(res.body.data.settings.size).toBe(2048);
    expect(res.body.data.settings.margin).toBe(20);
  });
});