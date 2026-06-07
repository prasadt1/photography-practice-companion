/**
 * Central API fetch — attaches X-User-Id when Firebase (or explicit) scope is set.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

let scopeUserId: string | null = null;

export function setApiUserScope(userId: string | null): void {
  scopeUserId = userId;
}

export function getApiUserScope(): string | null {
  return scopeUserId;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

const API_TIMEOUT_MS = 45_000;

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (scopeUserId) {
    headers.set('X-User-Id', scopeUserId);
  }

  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), API_TIMEOUT_MS);

  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) {
      timeoutController.abort();
    } else {
      callerSignal.addEventListener('abort', () => timeoutController.abort(), { once: true });
    }
  }

  try {
    return await fetch(apiUrl(path), {
      ...init,
      headers,
      signal: timeoutController.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out — the API may be waking up. Try again in a moment.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
