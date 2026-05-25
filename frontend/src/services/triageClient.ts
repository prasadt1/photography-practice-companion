import type { PendingApproval, TriageScanResult } from '../types/triage';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 502 || res.status === 503) {
      throw new Error(
        'API not reachable. In another terminal run: make api-dev (port 8081), then retry.',
      );
    }
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPendingApprovals(agentName = 'triage'): Promise<{
  items: PendingApproval[];
  total: number;
}> {
  const q = new URLSearchParams({ status: 'pending', agent_name: agentName });
  return fetch(`${API_BASE}/api/v1/pending-approvals?${q}`).then(
    parseJson<{ items: PendingApproval[]; total: number }>,
  );
}

export function runTriageScan(): Promise<TriageScanResult> {
  return fetch(`${API_BASE}/api/v1/triage/scan`, { method: 'POST' }).then(
    parseJson<TriageScanResult>,
  );
}

export function decideApproval(
  id: string,
  action: 'approve' | 'reject',
): Promise<PendingApproval> {
  return fetch(`${API_BASE}/api/v1/pending-approvals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  }).then(parseJson<PendingApproval>);
}
