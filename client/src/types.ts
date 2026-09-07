export type LinkStatus = 'ACTIVE' | 'DISABLED' | 'EXPIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  id: string;
  userId: string | null;
  originalUrl: string;
  shortCode: string;
  customAlias: string | null;
  title: string | null;
  status: LinkStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  clickCount: number;
  effectiveStatus: LinkStatus;
  shortUrl: string;
}

export interface LinkPage {
  items: Link[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QrSettings {
  id: string;
  linkId: string;
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  margin: number;
  logoUrl: string | null;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueVisitors: number;
  todayClicks: number;
  last7DaysClicks: number;
}

export interface SeriesPoint {
  date: string;
  clicks: number;
}

export interface BreakdownRow {
  name: string;
  value: number;
}

export interface CreateLinkInput {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  expiresAt?: string;
}

export interface UpdateLinkInput {
  originalUrl?: string;
  title?: string | null;
  customAlias?: string | null;
  expiresAt?: string | null;
}

export interface QrSettingsInput {
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  margin: number;
  logoUrl: string | null;
}