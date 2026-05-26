/**
 * Memory tab — portfolio + aesthetic profile from Coach API.
 */

import type {
  AestheticProfileSummary,
  PortfolioListResponse,
  PortfolioTrendsResponse,
} from '../types/memory';
import { apiFetch } from '../lib/apiFetch';

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type SortField = 'date' | 'score' | 'composition' | 'lighting' | 'technique' | 'creativity' | 'subject_impact';
export type SortOrder = 'asc' | 'desc';

export interface FetchPortfolioOptions {
  limit?: number;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  /** Filter by user-applied tag */
  userTag?: string;
}

export function fetchPortfolio(options: FetchPortfolioOptions = {}): Promise<PortfolioListResponse> {
  const { limit = 48, sortBy = 'date', sortOrder = 'desc', userTag } = options;
  const params = new URLSearchParams({
    limit: String(limit),
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  if (userTag) {
    params.set('user_tag', userTag);
  }
  return getJson(`/api/v1/portfolio?${params}`);
}

export function fetchAestheticProfile(): Promise<AestheticProfileSummary> {
  return getJson('/api/v1/aesthetic-profile');
}

export function fetchPortfolioTrends(limit = 12): Promise<PortfolioTrendsResponse> {
  return getJson(`/api/v1/portfolio/trends?limit=${limit}`);
}
