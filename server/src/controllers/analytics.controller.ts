import type { Request, Response } from 'express';
import {
  getAnalyticsSummary,
  getBrowsersBreakdown,
  getClicksSeries,
  getCountriesBreakdown,
  getDevicesBreakdown,
  getOsBreakdown,
  getReferrersBreakdown,
} from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/sendSuccess';

function parseIntParam(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await getAnalyticsSummary(req.user!.id, req.params.id);
  sendSuccess(res, { summary });
});

export const getClicks = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseIntParam(req.query.days, 30)));
  const series = await getClicksSeries(req.user!.id, req.params.id, days);
  sendSuccess(res, { series, days });
});

export const getDevices = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await getDevicesBreakdown(req.user!.id, req.params.id);
  sendSuccess(res, { breakdown });
});

export const getBrowsers = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await getBrowsersBreakdown(req.user!.id, req.params.id);
  sendSuccess(res, { breakdown });
});

export const getOperatingSystems = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await getOsBreakdown(req.user!.id, req.params.id);
  sendSuccess(res, { breakdown });
});

export const getCountries = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await getCountriesBreakdown(req.user!.id, req.params.id);
  sendSuccess(res, { breakdown });
});

export const getReferrers = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await getReferrersBreakdown(req.user!.id, req.params.id);
  sendSuccess(res, { breakdown });
});