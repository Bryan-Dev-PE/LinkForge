import type { Request } from 'express';
import { createHmac } from 'node:crypto';
import { env } from '../config/env';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (env.trustProxy && forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    if (first) return first.trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function getIpHashSalt(): string {
  return env.analyticsPepper;
}

export function anonymizeIp(ip: string): string {
  return createHmac('sha256', getIpHashSalt()).update(ip).digest('hex').slice(0, 24);
}