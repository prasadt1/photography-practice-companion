import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { ChatErrorBanner } from './ChatErrorBanner';
import { TabEmptyState } from './TabEmptyState';
import { MentorMarkdown } from './MentorMarkdown';
import { friendlyErrorMessage } from '../lib/friendlyError';
import { mentorLoadingStage } from '../lib/mentorLoadingStages';
import {
  fetchMentorSuggestedQuestions,
  loadSessionId,
  sendMentorMessage,
  type ChatMessage,
} from '../services/mentorClient';
import type { UserMode } from '../types/practice';

const STARTERS_BY_MODE: Record<UserMode, string[]> = {
  hobbyist: [
    'How am I doing so far?',
    'Show me themes from my recent critiques.',
    "What's distinctive about my work?",
  ],
  working_pro: [
    'Which of my recent photos are strongest for print sales?',
    'What patterns do you see across my portfolio?',
    'How can I improve consistency for my shop listings?',
  ],
};

interface Props {
  mode: UserMode;
}

export const MentorTab: React.FC<Props> = ({ mode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitSec, setWaitSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [starters, setStarters] = useState<string[]>(STARTERS_BY_MODE[mode]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setStarters(STARTERS_BY_MODE[mode]);
    void fetchMentorSuggestedQuestions(mode)
      .then((res) => {
        if (res.questions.length > 0) setStarters(res.questions);
      })
      .catch(() => {
        /* keep mode defaults */
      });
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setWaitSec(0);
      return;
    }
    const tick = window.setInterval(() => setWaitSec((s) => s + 1), 1000);
    return () => window.clearInterval(tick);
  }, [loading]);

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setLastFailedText(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await sendMentorMessage(trimmed, mode, { signal: controller.signal });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
        },
      ]);
    } catch (e) {
      const msg = friendlyErrorMessage(e);
      if (e instanceof Error && e.name === 'AbortError') {
        setError(msg);
      } else {
        setError(msg);
        setLastFailedText(trimmed);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInput(trimmed);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }, [loading, mode]);

  const hasSession = Boolean(loadSessionId());
  const stageMessage = mentorLoadingStage(waitSec, mode);

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto flex flex-col min-h-[60vh]">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Ask Mentor</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-white">
          Ask me about your progress
        </h1>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          I look across your past critiques and portfolio — tuned for{' '}
          <span className="text-stone-300">
            {mode === 'working_pro' ? 'working pro' : 'hobbyist'}
          </span>{' '}
          goals. Replies can take 30–90 seconds when I dig through your library.
        </p>
      </div>

      <div className="flex-1 flex flex-col rounded-xl border border-warm bg-surface-1 min-h-[400px] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="py-4">
              <TabEmptyState
                icon={Sparkles}
                title="Start a conversation"
                description="I search your past critiques and portfolio memory — replies can take 30–90 seconds when I dig through your library."
                steps={[
                  'Upload a few photos in Studio so I have memory to draw on',
                  'Pick a suggested question below, or type your own',
                  'Open Glass Box on any critique to see what I remembered',
                ]}
              />
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-500 text-on-brand whitespace-pre-wrap'
                    : 'bg-surface-3/90 text-stone-100 border border-warm/50'
                }`}
              >
                {m.role === 'assistant' ? (
                  <MentorMarkdown content={m.content} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div
              className="flex flex-col gap-2 text-stone-300 text-sm rounded-xl border border-warm/60 bg-canvas-elevated/50 p-4"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-brand-400" />
                  <span className="font-medium">{stageMessage}</span>
                </div>
                {waitSec >= 8 && (
                  <button
                    type="button"
                    onClick={cancelRequest}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:text-white border border-warm hover:border-warm"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                )}
              </div>
              <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full bg-brand-500/80 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(95, 12 + waitSec * 1.2)}%` }}
                />
              </div>
              <p className="text-xs text-muted">
                {mode === 'working_pro'
                  ? `Often 60–90 seconds · ${waitSec}s — keep this tab open`
                  : `Usually 30–60 seconds · ${waitSec}s — keep this tab open`}
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <ChatErrorBanner
            message={error}
            onRetry={
              lastFailedText
                ? () => {
                    setError(null);
                    void send(lastFailedText);
                  }
                : undefined
            }
            onDismiss={() => setError(null)}
          />
        )}

        <div className="px-3 py-2 border-t border-warm/80 bg-canvas-elevated/40">
          <p className="text-[10px] text-muted uppercase tracking-wide mb-2">
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {starters.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => void send(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-warm text-stone-300 hover:border-brand-500 hover:text-brand-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <form
          className="p-3 border-t border-warm flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={loading}
            className="flex-1 rounded-lg bg-canvas-elevated border border-warm px-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-brand-500 text-on-brand disabled:opacity-40 hover:bg-brand-400 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {hasSession && (
        <p className="text-xs text-muted mt-2 text-center">
          Session continues across messages (stored in this browser).
        </p>
      )}
    </div>
  );
};
