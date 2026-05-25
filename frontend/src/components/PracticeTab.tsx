import React, { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Camera,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import {
  acceptAssignment,
  completeAssignment,
  declineAssignment,
  fetchAssignments,
  proposeAssignment,
} from '../services/practiceClient';
import { friendlyErrorMessage } from '../lib/friendlyError';
import { formatSkillApplicationDelta } from '../lib/formatSkillDelta';
import { HitlReasoningCallout } from './HitlReasoningCallout';
import { PracticeInlineShootBanner } from './PracticeInlineShootBanner';
import { PracticeCardsSkeleton } from './SkeletonBlocks';
import type { Assignment, ReflectionResult, UserMode } from '../types/practice';

interface Props {
  mode: UserMode;
  onGoToStudio: () => void;
  onGoToField: () => void;
  onAssignmentsChange?: () => void;
}

export const PracticeTab: React.FC<Props> = ({
  mode,
  onGoToStudio,
  onGoToField,
  onAssignmentsChange,
}) => {
  const [proposed, setProposed] = useState<Assignment[]>([]);
  const [active, setActive] = useState<Assignment[]>([]);
  const [completed, setCompleted] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReflection, setLastReflection] = useState<ReflectionResult | null>(null);
  const [expandedCompletedId, setExpandedCompletedId] = useState<string | null>(null);
  const [shootBanner, setShootBanner] = useState<Assignment | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssignments();
      setProposed(data.proposed);
      setActive(data.active);
      setCompleted(data.completed);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePropose = async () => {
    setActing('propose');
    setError(null);
    try {
      await proposeAssignment(mode);
      await load();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  const handleAccept = async (id: string) => {
    setActing(id);
    try {
      const accepted = await acceptAssignment(id);
      await load();
      onAssignmentsChange?.();
      setShootBanner(accepted);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActing(id);
    try {
      await declineAssignment(id);
      await load();
      onAssignmentsChange?.();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActing(`complete-${id}`);
    setError(null);
    try {
      const result = await completeAssignment(id);
      setLastReflection(result.reflection);
      await load();
      onAssignmentsChange?.();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeIn space-y-6 max-w-3xl mx-auto">
        <PracticeCardsSkeleton />
        <p className="text-sm text-muted text-center">Loading practice assignments…</p>
      </div>
    );
  }

  const focus: 'proposed' | 'active' | 'idle' =
    proposed.length > 0 ? 'proposed' : active.length > 0 ? 'active' : 'idle';

  return (
    <div className="animate-fadeIn space-y-8 max-w-3xl mx-auto">
      {shootBanner && (
        <PracticeInlineShootBanner
          assignment={shootBanner}
          onShootNow={() => {
            setShootBanner(null);
            onGoToField();
          }}
          onStudioUpload={() => {
            setShootBanner(null);
            onGoToStudio();
          }}
          onDismiss={() => setShootBanner(null)}
        />
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">My Practice</h2>
          <p className="text-muted text-sm">
            I&apos;ll suggest a focused assignment — you accept or pass — then shoot in the field
            or Studio.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-warm text-stone-300 text-sm hover:bg-surface-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            disabled={acting !== null || proposed.length > 0}
            onClick={() => void handlePropose()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-on-brand text-sm font-semibold disabled:opacity-50"
          >
            {acting === 'propose' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Suggest practice
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {focus === 'proposed' &&
        proposed.map((a) => (
          <ProposedCard
            key={a.id}
            assignment={a}
            busy={acting === a.id}
            onAccept={() => void handleAccept(a.id)}
            onDecline={() => void handleDecline(a.id)}
          />
        ))}

      {focus !== 'proposed' && lastReflection && (
        <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-5 text-sm text-stone-200">
          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">
            Reflection complete
          </p>
          <p className="leading-relaxed mb-2">{lastReflection.summary}</p>
          <p className="text-brand-400 text-xs">
            {formatSkillApplicationDelta(lastReflection.skillDelta.delta)} · applied brief:{' '}
            {lastReflection.appliedBrief ? 'yes' : 'not yet'}
          </p>
        </div>
      )}

      {focus === 'active' &&
        active.map((a) => (
          <ActiveCard
            key={a.id}
            assignment={a}
            onGoToStudio={onGoToStudio}
            onGoToField={onGoToField}
            onComplete={() => void handleComplete(a.id)}
            completing={acting === `complete-${a.id}`}
          />
        ))}

      {focus === 'idle' && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-warm">
          <Target className="w-10 h-10 text-stone-600 mx-auto mb-3" />
          <p className="text-muted">No active practice yet.</p>
          <p className="text-sm text-muted mt-1">
            Upload a few photos in Studio, then tap Suggest practice.
          </p>
        </div>
      )}

      {completed.length > 0 && focus !== 'proposed' && (
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
              Completed
            </h3>
            {focus === 'active' && (
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                {showHistory ? 'Hide history' : 'Show history'}
              </button>
            )}
          </div>
          {(focus === 'idle' || showHistory) && (
          <ul className="space-y-3">
            {completed.map((a) => (
              <CompletedCard
                key={a.id}
                assignment={a}
                expanded={expandedCompletedId === a.id}
                onToggle={() =>
                  setExpandedCompletedId((id) => (id === a.id ? null : a.id))
                }
              />
            ))}
          </ul>
          )}
        </section>
      )}
    </div>
  );
};

function CompletedCard({
  assignment,
  expanded,
  onToggle,
}: {
  assignment: Assignment;
  expanded: boolean;
  onToggle: () => void;
}) {
  const long = assignment.brief.length > 160;
  return (
    <li className="rounded-xl bg-surface-1 border border-warm text-sm overflow-hidden">
      <button
        type="button"
        onClick={long ? onToggle : undefined}
        className={`w-full text-left px-4 py-3 ${long ? 'hover:bg-surface-1 cursor-pointer' : 'cursor-default'}`}
      >
        <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" aria-hidden />
          Completed
        </p>
        <p
          className={`font-medium text-stone-200 leading-relaxed ${
            expanded || !long ? '' : 'line-clamp-2'
          }`}
        >
          {assignment.brief}
        </p>
        {long && !expanded && (
          <span className="text-[10px] text-brand-400 mt-1 inline-block">Show full brief</span>
        )}
        {assignment.skillDelta && (
          <p className="text-brand-400 text-xs mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {formatSkillApplicationDelta(assignment.skillDelta.delta)}
          </p>
        )}
      </button>
      {expanded && assignment.rationale && (
        <p className="text-xs text-muted border-t border-warm px-4 py-3 leading-relaxed">
          {assignment.rationale}
        </p>
      )}
    </li>
  );
}

function ProposedCard({
  assignment,
  busy,
  onAccept,
  onDecline,
}: {
  assignment: Assignment;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <section className="rounded-2xl border-2 border-amber-500/40 bg-surface-1 p-6">
      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
        Proposed — your approval required
      </p>
      <p className="text-xs text-brand-400 mb-3 capitalize">
        Focus: {assignment.targetSkill.replace(/_/g, ' ')}
      </p>
      <p className="text-stone-100 leading-relaxed mb-4">{assignment.brief}</p>
      {assignment.rationale ? (
        <div className="mb-6">
          <HitlReasoningCallout reasoning={assignment.rationale} />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-on-brand font-semibold text-sm disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDecline}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-warm text-stone-300 font-semibold text-sm hover:bg-surface-2 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Decline
        </button>
      </div>
    </section>
  );
}

function ActiveCard({
  assignment,
  onGoToStudio,
  onGoToField,
  onComplete,
  completing,
}: {
  assignment: Assignment;
  onGoToStudio: () => void;
  onGoToField: () => void;
  onComplete: () => void;
  completing: boolean;
}) {
  let when = '';
  try {
    when = formatDistanceToNow(new Date(assignment.createdAt), { addSuffix: true });
  } catch {
    when = '';
  }

  return (
    <section className="rounded-2xl border border-brand-500/50 bg-surface-1 p-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-400 uppercase tracking-wider">
          <Target className="w-3 h-3" aria-hidden />
          Active practice
        </span>
        <span className="text-[10px] text-muted">{when}</span>
      </div>
      <p className="text-xs text-muted mb-3 capitalize">
        Focus: {assignment.targetSkill.replace(/_/g, ' ')}
      </p>
      <p className="text-stone-100 leading-relaxed mb-3">{assignment.brief}</p>
      {assignment.rationale ? (
        <HitlReasoningCallout reasoning={assignment.rationale} />
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGoToField}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-on-brand font-semibold text-sm hover:shadow-lg hover:shadow-brand-500/25 transition-shadow"
        >
          <Camera className="w-4 h-4" />
          Field (camera)
        </button>
        <button
          type="button"
          onClick={onGoToStudio}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-warm text-stone-200 font-semibold text-sm hover:bg-surface-2"
        >
          Studio upload
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={completing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-500/50 text-brand-400 font-semibold text-sm hover:bg-brand-500/10 disabled:opacity-50"
        >
          {completing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Mark complete
        </button>
        <p className="text-xs text-muted w-full">
          Shoot in Field or upload in Studio — then Mark complete for Reflection.
        </p>
      </div>
    </section>
  );
}
