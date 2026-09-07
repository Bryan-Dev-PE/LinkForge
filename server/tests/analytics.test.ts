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

async function seedClicks(linkId: string, count: number): Promise<void> {
  const now = Date.now();
  const records = Array.from({ length: count }, (_, i) => ({
    linkId,
    timestamp: new Date(now - i * 60 * 60 * 1000),
    deviceType: i % 3 === 0 ? 'mobile' : 'desktop',
    browser: i % 5 === 0 ? 'Edge' : 'Chrome',
    operatingSystem: 'Windows',
    country: i % 2 === 0 ? 'PE' : 'US',
    anonymizedIp: `aaaa${i}`,
    referrer: 'example.com',
  }));
  await prisma.clickEvent.createMany({ data: records });
}

describe('Analytics API', () => {
  beforeAll(async () => {
    await setupTestServer();
  });
  afterAll(async () => {
    await teardownTestServer();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns summary statistics', async () => {
    const user = await registerUser('Carl Sagan', 'sagan@example.com', 'secret12');
    const link = await createLinkFor(user, 'https://cosmos.example');
    await seedClicks(link.id, 10);

    const res = await request(server)
      .get(`/api/links/${link.id}/analytics/summary`)
      .set('Cookie', user.cookie)
      .expect(200);
    expect(res.body.data.summary.totalClicks).toBe(10);
    expect(res.body.data.summary.uniqueVisitors).toBe(10);
  });

  it('returns a daily clicks series over the last 30 days', async () => {
    const user = await registerUser('Carl Sagan', 'sagan@example.com', 'secret12');
    const link = await createLinkFor(user, 'https://cosmos.example');
    await seedClicks(link.id, 5);

    const res = await request(server)
      .get(`/api/links/${link.id}/analytics/clicks`)
      .set('Cookie', user.cookie)
      .expect(200);
    expect(res.body.data.series.length).toBe(30);
    const totalClicksInSeries = res.body.data.series.reduce(
      (sum: number, p: { clicks: number }) => sum + p.clicks,
      0,
    );
    expect(totalClicksInSeries).toBe(5);
  });

  it('returns device, browser, and country breakdowns as percentages', async () => {
    const user = await registerUser('Carl Sagan', 'sagan@example.com', 'secret12');
    const link = await createLinkFor(user, 'https://cosmos.example');
    await seedClicks(link.id, 6);

    const [devices, browsers, countries] = await Promise.all([
      request(server).get(`/api/links/${link.id}/analytics/devices`).set('Cookie', user.cookie).expect(200),
      request(server).get(`/api/links/${link.id}/analytics/browsers`).set('Cookie', user.cookie).expect(200),
      request(server).get(`/api/links/${link.id}/analytics/countries`).set('Cookie', user.cookie).expect(200),
    ]);

    expect(devices.body.data.breakdown.length).toBeGreaterThan(0);
    const deviceTotal = devices.body.data.breakdown.reduce(
      (sum: number, r: { value: number }) => sum + r.value,
      0,
    );
    expect(Math.round(deviceTotal)).toBe(100);
    expect(browsers.body.data.breakdown.some((r: { name: string }) => r.name === 'Chrome')).toBe(true);
    expect(countries.body.data.breakdown.some((r: { name: string }) => r.name === 'PE')).toBe(true);
  });

  it('rejects analytics access for links the user does not own', async () => {
    const owner = await registerUser('Owner', 'acct-owner@example.com', 'secret12');
    const link = await createLinkFor(owner, 'https://private.example');
    const stranger = await registerUser('Stranger', 'acct-stranger@example.com', 'secret12');

    await request(server)
      .get(`/api/links/${link.id}/analytics/summary`)
      .set('Cookie', stranger.cookie)
      .expect(404);
    await request(server)
      .get(`/api/links/${link.id}/analytics/clicks`)
      .set('Cookie', stranger.cookie)
      .expect(404);
  });
});