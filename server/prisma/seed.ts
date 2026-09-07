import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';
import { logger } from '../src/utils/logger';

const COUNTRIES = [
  { code: 'US', share: 42, regions: [{ name: 'California', cities: ['San Francisco', 'Los Angeles', 'San Diego'] }, { name: 'New York', cities: ['New York', 'Buffalo', 'Rochester'] }, { name: 'Texas', cities: ['Austin', 'Dallas', 'Houston'] }] },
  { code: 'GB', share: 16, regions: [{ name: 'England', cities: ['London', 'Manchester', 'Bristol'] }, { name: 'Scotland', cities: ['Edinburgh', 'Glasgow'] }] },
  { code: 'DE', share: 11, regions: [{ name: 'Berlin', cities: ['Berlin'] }, { name: 'Bavaria', cities: ['Munich', 'Nuremberg'] }] },
  { code: 'IN', share: 9, regions: [{ name: 'Karnataka', cities: ['Bengaluru'] }, { name: 'Maharashtra', cities: ['Mumbai', 'Pune'] }] },
  { code: 'CA', share: 8, regions: [{ name: 'Ontario', cities: ['Toronto', 'Ottawa'] }, { name: 'British Columbia', cities: ['Vancouver'] }] },
  { code: 'BR', share: 6, regions: [{ name: 'Sao Paulo', cities: ['Sao Paulo'] }, { name: 'Rio de Janeiro', cities: ['Rio de Janeiro'] }] },
  { code: 'AU', share: 5, regions: [{ name: 'New South Wales', cities: ['Sydney'] }, { name: 'Victoria', cities: ['Melbourne'] }] },
  { code: 'FR', share: 3, regions: [{ name: 'Ile-de-France', cities: ['Paris'] }] },
];

function pickWeighted<T, K extends keyof T>(items: Array<{ share?: number } & T>, key: K): T[K] | undefined {
  const total = items.reduce((sum, item) => sum + (item.share ?? 1), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.share ?? 1;
    if (roll <= 0) return item[key];
  }
  return items[items.length - 1]?.[key];
}

const DEVICES = [
  { deviceType: 'Mobile', browser: 'Chrome Mobile', os: 'Android', share: 44 },
  { deviceType: 'Mobile', browser: 'Mobile Safari', os: 'iOS', share: 19 },
  { deviceType: 'Desktop', browser: 'Chrome', os: 'Windows', share: 22 },
  { deviceType: 'Desktop', browser: 'Chrome', os: 'macOS', share: 6 },
  { deviceType: 'Desktop', browser: 'Firefox', os: 'Windows', share: 3 },
  { deviceType: 'Desktop', browser: 'Safari', os: 'macOS', share: 2 },
  { deviceType: 'Desktop', browser: 'Edge', os: 'Windows', share: 2 },
  { deviceType: 'Tablet', browser: 'Mobile Safari', os: 'iPadOS', share: 2 },
];

const REFERRERS = [
  { domain: null, share: 38 },
  { domain: 'google.com', share: 24 },
  { domain: 'twitter.com', share: 12 },
  { domain: 'linkedin.com', share: 8 },
  { domain: 'facebook.com', share: 8 },
  { domain: 'news.ycombinator.com', share: 5 },
  { domain: 'newsletter', share: 5 },
];

const BASE_URLS = [
  'https://landingpage.dev/product/announcement',
  'https://saasdocs.example/guides/getting-started',
  'https://news.example/2026/q3-report',
  'https://shop.example/collections/summer-collection',
];

const TITLES = ['Product announcement', 'Getting started guide', 'Q3 financial report', 'Summer collection'];

const EXPIRING = ['2026-12-31T23:59:59.000Z', null, null, '2026-10-15T00:00:00.000Z'];

interface SeedLink {
  alias: string;
  index: number;
}

function randomHex(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

async function main(): Promise<void> {
  const email = 'demo@linkforge.dev';
  const password = 'linkforge123';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: 'Alex Demo', passwordHash },
    create: { name: 'Alex Demo', email, passwordHash },
  });

  await prisma.clickEvent.deleteMany({ where: { link: { userId: user.id } } });
  await prisma.qrCode.deleteMany({ where: { link: { userId: user.id } } });
  await prisma.link.deleteMany({ where: { userId: user.id } });

  const links: SeedLink[] = [];
  for (let i = 0; i < BASE_URLS.length; i += 1) {
    const alias = ['welcome-1', 'get-started', 'q3-report', 'summer-24'][i];
    links.push({ alias, index: i });
    await prisma.link.create({
      data: {
        userId: user.id,
        originalUrl: BASE_URLS[i],
        shortCode: alias,
        customAlias: alias,
        title: TITLES[i],
        expiresAt: EXPIRING[i],
      },
    });
  }

  const created = await prisma.link.findMany({ where: { userId: user.id } });
  const byAlias = new Map(created.map((link) => [link.customAlias, link.id]));

  for (const seed of links) {
    const linkId = byAlias.get(seed.alias);
    if (!linkId) continue;
    await prisma.qrCode.upsert({
      where: { linkId },
      update: {},
      create: {
        linkId,
        foregroundColor: ['#4338ca', '#0f172a', '#0e7490', '#be123c'][seed.index],
        backgroundColor: '#ffffff',
        size: 512,
        margin: 4,
      },
    });
  }

  const baseRate = [110, 65, 40, 28];
  const batches: Array<{
    linkId: string;
    timestamp: Date;
    country: string;
    region: string;
    city: string;
    deviceType: string;
    browser: string;
    operatingSystem: string;
    referrer: string | null;
    anonymizedIp: string;
  }> = [];

  const now = new Date();
  for (const seed of links) {
    const linkId = byAlias.get(seed.alias);
    if (!linkId) continue;
    for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
      const isWeekend = day.getDay() === 6 || day.getDay() === 0;
      const trend = 1 + 0.4 * (1 - dayOffset / 29);
      const count = Math.max(2, Math.round(baseRate[seed.index] * trend * (isWeekend ? 0.55 : 1)));
      for (let i = 0; i < count; i += 1) {
        const hour = Math.max(0, Math.min(23, Math.round(8 + Math.abs(randomNormal()) * 6)));
        const timestamp = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(Math.random() * 60));
        const country = pickWeighted(COUNTRIES, 'code') ?? 'US';
        const countryInfo = COUNTRIES.find((entry) => entry.code === country);
        const region = pickWeighted(countryInfo?.regions ?? [], 'name') ?? 'California';
        const regionInfo = countryInfo?.regions.find((entry) => entry.name === region);
        const city = regionInfo?.cities[Math.floor(Math.random() * regionInfo.cities.length)] ?? 'San Francisco';
        const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
        const referrer = pickWeighted(REFERRERS, 'domain') ?? null;
        batches.push({
          linkId,
          timestamp,
          country,
          region,
          city,
          deviceType: device.deviceType,
          browser: device.browser,
          operatingSystem: device.os,
          referrer,
          anonymizedIp: randomHex(24),
        });
      }
    }
  }

  for (let start = 0; start < batches.length; start += 2000) {
    await prisma.clickEvent.createMany({ data: batches.slice(start, start + 2000) });
  }

  const totalClicks = batches.length;
  logger.info(`Seeded demo account ${email}/${password} with ${created.length} links and ${totalClicks} click events.`);
}

function randomNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

main()
  .catch((err) => {
    logger.error('Seed failed', err instanceof Error ? err : String(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });