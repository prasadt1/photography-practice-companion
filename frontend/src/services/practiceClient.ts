import type {
  Assignment,
  AssignmentsResponse,
  CompleteAssignmentResponse,
  UserMode,
} from '../types/practice';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchAssignments(): Promise<AssignmentsResponse> {
  return fetch(`${API_BASE}/api/v1/assignments`).then(parseJson<AssignmentsResponse>);
}

export function proposeAssignment(mode: UserMode): Promise<Assignment> {
  return fetch(`${API_BASE}/api/v1/assignments/propose?mode=${mode}`, {
    method: 'POST',
  }).then(parseJson<Assignment>);
}

export function acceptAssignment(id: string): Promise<Assignment> {
  return fetch(`${API_BASE}/api/v1/assignments/${id}/accept`, { method: 'POST' }).then(
    parseJson<Assignment>,
  );
}

export function declineAssignment(id: string): Promise<Assignment> {
  return fetch(`${API_BASE}/api/v1/assignments/${id}/decline`, { method: 'POST' }).then(
    parseJson<Assignment>,
  );
}

export async function fetchActiveAssignment(): Promise<Assignment | null> {
  const res = await fetch(`${API_BASE}/api/v1/assignments/active`).then(parseJson<{
    active: Assignment | null;
  }>);
  return res.active;
}

export function completeAssignment(id: string): Promise<CompleteAssignmentResponse> {
  return fetch(`${API_BASE}/api/v1/assignments/${id}/complete`, { method: 'POST' }).then(
    parseJson<CompleteAssignmentResponse>,
  );
}
