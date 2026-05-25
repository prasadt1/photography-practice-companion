import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { MentorMarkdown } from './MentorMarkdown';
import {
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
  const bottomRef = useRef<HTMLDivElement>(null);

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

    try {
      const res = await sendMentorMessage(trimmed, mode);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
    } finally {
      setLoading(false);
    }
  }, [loading, mode]);

  const hasSession = Boolean(loadSessionId());
  const starters = STARTERS_BY_MODE[mode];

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto flex flex-col min-h-[60vh]">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Mentor Copilot</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Chat with your mentor
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Routed through the v5 orchestrator (persona:{' '}
          <span className="text-brand-300 font-medium">{mode.replace('_', ' ')}</span>
          ). Requires <code className="text-brand-400">make api-dev</code> on port 8081.
        </p>
      </div>

      <div className="flex-1 flex flex-col rounded-xl border border-slate-700 bg-slate-800/50 min-h-[400px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-slate-500 py-12">
              Ask about your progress, style, or portfolio memory — or pick a suggestion below.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-500 text-slate-900 whitespace-pre-wrap'
                    : 'bg-slate-700/90 text-slate-100 border border-slate-600/50'
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
            <div className="flex flex-col gap-1 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                {mode === 'working_pro'
                  ? 'Orchestrator → Print Sales (portfolio + listings)…'
                  : 'Orchestrator thinking…'}
              </div>
              <p className="text-xs text-slate-500 pl-6">
                {mode === 'working_pro'
                  ? `Often 60–90 seconds; waited ${waitSec}s. Do not refresh.`
                  : `Usually 20–40 seconds; waited ${waitSec}s.`}
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="px-4 pb-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="px-3 py-2 border-t border-slate-700/80 bg-slate-900/40">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {starters.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => void send(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-300 hover:border-brand-500 hover:text-brand-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <form
          className="p-3 border-t border-slate-700 flex gap-2"
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
            className="flex-1 rounded-lg bg-slate-900 border border-slate-600 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-brand-500 text-slate-900 disabled:opacity-40 hover:bg-brand-400 transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {hasSession && (
        <p className="text-xs text-slate-500 mt-2 text-center">
          Session continues across messages (stored in this browser).
        </p>
      )}
    </div>
  );
};
