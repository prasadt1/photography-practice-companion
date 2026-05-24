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
import { ShootNowDialog } from './ShootNowDialog';
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
  const [acceptedForShoot, setAcceptedForShoot] = useState<Assignment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssignments();
      setProposed(data.proposed);
      setActive(data.active);
      setCompleted(data.completed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
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
      setError(e instanceof Error ? e.message : 'Could not generate assignment');
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
      setAcceptedForShoot(accepted);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Accept failed');
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
      setError(e instanceof Error ? e.message : 'Decline failed');
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
      setError(e instanceof Error ? e.message : 'Could not complete assignment');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-3" />
        <p className="text-sm">Loading practice assignments…</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8 max-w-3xl mx-auto">
      {acceptedForShoot && (
        <ShootNowDialog
          assignment={acceptedForShoot}
          onShootNow={() => {
            setAcceptedForShoot(null);
            onGoToField();
          }}
          onStudioUpload={() => {
            setAcceptedForShoot(null);
            onGoToStudio();
          }}
          onLater={() => setAcceptedForShoot(null)}
        />
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Practice</h2>
          <p className="text-slate-400 text-sm">
            Planner proposes · you Accept or Decline (HITL) · then shoot in Studio.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            disabled={acting !== null || proposed.length > 0}
            onClick={() => void handlePropose()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-slate-900 text-sm font-semibold disabled:opacity-50"
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

      {proposed.map((a) => (
        <ProposedCard
          key={a.id}
          assignment={a}
          busy={acting === a.id}
          onAccept={() => void handleAccept(a.id)}
          onDecline={() => void handleDecline(a.id)}
        />
      ))}

      {lastReflection && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm text-slate-200">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
            Reflection complete
          </p>
          <p className="leading-relaxed mb-2">{lastReflection.summary}</p>
          <p className="text-emerald-400 font-mono text-xs">
            ISAR Δ {lastReflection.skillDelta.delta >= 0 ? '+' : ''}
            {(lastReflection.skillDelta.delta * 100).toFixed(0)}% on target skill · applied brief:{' '}
            {lastReflection.appliedBrief ? 'yes' : 'not yet'}
          </p>
        </div>
      )}

      {active.map((a) => (
        <ActiveCard
          key={a.id}
          assignment={a}
          onGoToStudio={onGoToStudio}
          onGoToField={onGoToField}
          onComplete={() => void handleComplete(a.id)}
          completing={acting === `complete-${a.id}`}
        />
      ))}

      {proposed.length === 0 && active.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-700">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No active practice yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            Upload a few photos in Studio, then tap Suggest practice.
          </p>
        </div>
      )}

      {completed.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Completed
          </h3>
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
    <li className="rounded-xl bg-slate-800/40 border border-slate-700 text-sm overflow-hidden">
      <button
        type="button"
        onClick={long ? onToggle : undefined}
        className={`w-full text-left px-4 py-3 ${long ? 'hover:bg-slate-800/60 cursor-pointer' : 'cursor-default'}`}
      >
        <p
          className={`font-medium text-slate-200 leading-relaxed ${
            expanded || !long ? '' : 'line-clamp-2'
          }`}
        >
          {assignment.brief}
        </p>
        {long && !expanded && (
          <span className="text-[10px] text-brand-400 mt-1 inline-block">Show full brief</span>
        )}
        {assignment.skillDelta && (
          <p className="text-emerald-400 text-xs mt-2">
            ISAR Δ {assignment.skillDelta.delta >= 0 ? '+' : ''}
            {(assignment.skillDelta.delta * 100).toFixed(0)}% on target skill
          </p>
        )}
      </button>
      {expanded && assignment.rationale && (
        <p className="text-xs text-slate-400 border-t border-slate-700 px-4 py-3 leading-relaxed">
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
    <section className="rounded-2xl border-2 border-amber-500/40 bg-slate-800/50 p-6">
      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
        Proposed — your approval required
      </p>
      <p className="text-xs text-brand-400 font-mono mb-3">{assignment.targetSkill}</p>
      <p className="text-slate-100 leading-relaxed mb-4">{assignment.brief}</p>
      <p className="text-sm text-slate-400 border-l-2 border-slate-600 pl-3 mb-6">
        {assignment.rationale}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-semibold text-sm disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDecline}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-semibold text-sm hover:bg-slate-800 disabled:opacity-50"
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
    <section className="rounded-2xl border border-brand-500/50 bg-slate-800/50 p-6">
      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">
        Active practice · {when}
      </p>
      <p className="text-xs text-slate-500 font-mono mb-3">{assignment.targetSkill}</p>
      <p className="text-slate-100 leading-relaxed mb-3">{assignment.brief}</p>
      <p className="text-sm text-slate-400">{assignment.rationale}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGoToField}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-slate-900 font-semibold text-sm hover:shadow-lg hover:shadow-brand-500/25 transition-shadow"
        >
          <Camera className="w-4 h-4" />
          Field (camera)
        </button>
        <button
          type="button"
          onClick={onGoToStudio}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-200 font-semibold text-sm hover:bg-slate-800"
        >
          Studio upload
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={completing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/50 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/10 disabled:opacity-50"
        >
          {completing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Mark complete
        </button>
        <p className="text-xs text-slate-500 w-full">
          Shoot in Field or upload in Studio — then Mark complete for Reflection.
        </p>
      </div>
    </section>
  );
}
