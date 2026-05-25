/**
 * User persona (MongoDB users.persona) — Phase 2 orchestrator routing.
 */

import type { UserMode } from '../types/practice';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface UserProfile {
  userId: string | null;
  persona: UserMode | 'vision_impairment';
  preferences: Record<string, unknown>;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/v1/users/me`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<UserProfile>;
}

export async function updatePersona(persona: UserMode): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/v1/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<UserProfile>;
}

export function personaToUserMode(persona: string): UserMode {
  return persona === 'working_pro' ? 'working_pro' : 'hobbyist';
}
