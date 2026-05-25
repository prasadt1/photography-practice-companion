import type { PendingApproval } from '../types/triage';

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

export interface PrintSalesScanResult {
  proposalsCreated: Array<{ pendingApprovalId: string; status: string }>;
  pending: { items: PendingApproval[]; total: number };
  supersededPending?: number;
  candidatesConsidered?: number;
}

export function fetchPrintPending(): Promise<{ items: PendingApproval[]; total: number }> {
  const q = new URLSearchParams({ status: 'pending', agent_name: 'print_sales' });
  return fetch(`${API_BASE}/api/v1/pending-approvals?${q}`).then(
    parseJson<{ items: PendingApproval[]; total: number }>,
  );
}

export function runPrintSalesScan(marketplace = 'etsy'): Promise<PrintSalesScanResult> {
  const q = new URLSearchParams({ marketplace });
  return fetch(`${API_BASE}/api/v1/print-sales/scan?${q}`, { method: 'POST' }).then(
    parseJson<PrintSalesScanResult>,
  );
}

export function decidePrintApproval(
  id: string,
  action: 'approve' | 'reject' | 'modify',
  overridePayload?: Record<string, unknown>,
): Promise<PendingApproval> {
  return fetch(`${API_BASE}/api/v1/pending-approvals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      overridePayload: overridePayload ?? undefined,
    }),
  }).then(parseJson<PendingApproval>);
}
