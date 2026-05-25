/**
 * Mentor Copilot — orchestrator chat API (Phase 2).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const SESSION_KEY = 'practice_companion_mentor_session';
const PERSONA_KEY = 'practice_companion_mentor_persona';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  persona: string;
  sessionId: string;
  userId: string;
}

export function loadSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function saveSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_KEY, sessionId);
}

/** Drop chat history when persona changes so toolset matches a new session. */
export function clearMentorSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function rememberPersonaForSession(persona: string): void {
  const prev = sessionStorage.getItem(PERSONA_KEY);
  if (prev && prev !== persona) {
    clearMentorSession();
  }
  sessionStorage.setItem(PERSONA_KEY, persona);
}

export async function sendMentorMessage(
  message: string,
  persona: 'hobbyist' | 'working_pro',
): Promise<ChatResponse> {
  rememberPersonaForSession(persona);
  const sessionId = loadSessionId();
  const res = await fetch(`${API_BASE}/api/v1/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId: sessionId ?? undefined,
      persona,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Chat failed (${res.status})`);
  }
  const data = (await res.json()) as ChatResponse;
  saveSessionId(data.sessionId);
  return data;
}
