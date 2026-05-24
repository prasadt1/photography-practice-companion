/**
 * Memory tab — portfolio + aesthetic profile from Coach API.
 */

import type { AestheticProfileSummary, PortfolioListResponse } from '../types/memory';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPortfolio(limit = 48): Promise<PortfolioListResponse> {
  return getJson(`/api/v1/portfolio?limit=${limit}`);
}

export function fetchAestheticProfile(): Promise<AestheticProfileSummary> {
  return getJson('/api/v1/aesthetic-profile');
}
