import React, { useCallback, useEffect, useState } from 'react';
import { ScanProgressBanner } from './ScanProgressBanner';
import { triageScanStage } from '../lib/scanLoadingStages';
import { Check, ExternalLink, ImageIcon, Layers, Loader2, Trash2, X } from 'lucide-react';
import { HitlReasoningCallout } from './HitlReasoningCallout';
import { friendlyErrorMessage } from '../lib/friendlyError';
import { entryIdsForProposal } from '../lib/triageEntryIds';
import {
  decideApproval,
  fetchPendingApprovals,
  runTriageScan,
} from '../services/triageClient';
import { fetchPortfolio } from '../services/memoryClient';
import type { UserMode } from '../types/practice';
import type { PendingApproval } from '../types/triage';
import type { PortfolioListItem } from '../types/memory';

interface Props {
  mode: UserMode;
  onGoToMemory?: () => void;
}

const MAX_THUMBS = 6;

type EntryPreview = Pick<PortfolioListItem, 'id' | 'imageUrl' | 'sceneDescription' | 'overallAverage'>;

function ProposalThumbnails({
  entryIds,
  previews,
  highlightDeleteId,
}: {
  entryIds: string[];
  previews: Map<string, EntryPreview>;
  highlightDeleteId?: string;
}) {
  if (entryIds.length === 0) return null;

  const shown = entryIds.slice(0, MAX_THUMBS);
  const extra = entryIds.length - shown.length;

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted uppercase tracking-wide">
        {entryIds.length === 1 ? 'This photo' : `${entryIds.length} photos in this suggestion`}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {shown.map((id) => {
          const entry = previews.get(id);
          const isDeleteTarget = highlightDeleteId === id;
          return (
            <div
              key={id}
              className={`shrink-0 w-20 rounded-lg overflow-hidden border bg-black relative ${
                isDeleteTarget ? 'border-red-500/80 ring-1 ring-red-500/50' : 'border-warm'
              }`}
              title={
                isDeleteTarget
                  ? 'Would be removed if you approve'
                  : entry?.sceneDescription?.slice(0, 120) || 'Portfolio photo'
              }
            >
              <div className="aspect-square relative">
                {entry?.imageUrl ? (
                  <img
                    src={entry.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-stone-600 bg-canvas-elevated">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {entry?.overallAverage != null && (
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-canvas-elevated/90 text-brand-400">
                    {entry.overallAverage}
                  </span>
                )}
                {isDeleteTarget && (
                  <span className="absolute inset-0 flex items-center justify-center bg-red-950/50 text-[9px] font-bold text-red-200 uppercase">
                    Remove
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {extra > 0 && (
          <div className="shrink-0 w-20 aspect-square rounded-lg border border-dashed border-warm flex items-center justify-center text-xs text-muted">
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}

function describeProposal(item: PendingApproval): string {
  const payload = item.proposedAction.payload as {
    tags?: string[];
  };
  if (item.proposedAction.type === 'apply_tags') {
    const n = entryIdsForProposal(item).length;
    const tags = (payload.tags ?? []).map((t) => t.replace(/_/g, ' ')).join(', ');
    return `Add labels (${tags}) to ${n} photo${n === 1 ? '' : 's'} so they are easier to find in Memory and Mentor search.`;
  }
  if (item.proposedAction.type === 'delete_entry') {
    return 'Remove one near-duplicate photo from your library (only if you agree it is not worth keeping).';
  }
  return item.agentReasoning;
}

export const TriageTab: React.FC<Props> = ({ mode, onGoToMemory }) => {
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanWaitSec, setScanWaitSec] = useState(0);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Map<string, EntryPreview>>(new Map());

  const loadPreviews = useCallback(async () => {
    try {
      const data = await fetchPortfolio(100);
      const map = new Map<string, EntryPreview>();
      for (const e of data.entries) {
        map.set(e.id, {
          id: e.id,
          imageUrl: e.imageUrl,
          sceneDescription: e.sceneDescription,
          overallAverage: e.overallAverage,
        });
      }
      setPreviews(map);
    } catch {
      /* thumbnails are optional; cards still work */
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingApprovals();
      setItems(data.items);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void loadPreviews();
  }, [refresh, loadPreviews]);

  useEffect(() => {
    if (!scanning) {
      setScanWaitSec(0);
      return;
    }
    const tick = window.setInterval(() => setScanWaitSec((s) => s + 1), 1000);
    return () => window.clearInterval(tick);
  }, [scanning]);

  const handleScan = async () => {
    if (mode !== 'hobbyist' && mode !== 'working_pro') return;
    setScanning(true);
    setError(null);
    try {
      const result = await runTriageScan();
      const n = result.clusters?.length ?? 0;
      const created = result.proposalsCreated?.length ?? 0;
      const cleared = (result as { supersededPending?: number }).supersededPending ?? 0;
      setScanSummary(
        cleared > 0
          ? `Replaced ${cleared} old proposal(s). Found ${n} groups; ${created} new card(s) to review.`
          : `Found ${n} groups in your library; ${created} proposal(s) to review.`,
      );
      setItems(result.pending?.items ?? []);
      void loadPreviews();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setScanning(false);
    }
  };

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      await decideApproval(id, action);
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (action === 'approve') {
        setScanSummary('Approved — open My Work and hit Refresh to see new labels on your photos.');
        void loadPreviews();
      }
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  if (mode !== 'hobbyist' && mode !== 'working_pro') {
    return (
      <p className="text-muted text-center py-12">
        Label Photos is available in Hobbyist and Working pro modes.
      </p>
    );
  }

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <Layers className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Label Photos</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Label your photo library</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          You already get tags when you upload in <strong className="text-stone-300">My Studio</strong>.
          When you have many photos, I can suggest consistent labels across a shoot — like
          &quot;still life&quot; on a group so you can find them later in My Work.
        </p>
      </div>

      <section className="rounded-xl border border-warm bg-surface-1 p-4 text-sm text-stone-300 space-y-3">
        <p className="font-semibold text-white">What you do here (3 steps)</p>
        <ol className="list-decimal list-inside space-y-2 text-muted">
          <li>
            <span className="text-stone-300">Scan</span> — groups similar photos in Memory.
          </li>
          <li>
            <span className="text-stone-300">Review</span> — approve or decline each suggestion (nothing
            changes until you approve).
          </li>
          <li>
            <span className="text-stone-300">See result</span> — open{' '}
            {onGoToMemory ? (
              <button
                type="button"
                onClick={onGoToMemory}
                className="text-brand-400 hover:text-brand-300 underline inline-flex items-center gap-0.5"
              >
                Memory <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-brand-400">Memory</span>
            )}{' '}
            → Refresh → tags appear on each photo; dominant themes at the top of My Work update too.
          </li>
        </ol>
        <p className="text-xs text-muted border-t border-warm pt-3">
          Mentor can also search past critiques by theme (e.g. &quot;backlit&quot;) — tags and Glass Box
          text make that work better.
        </p>
      </section>

      <button
        type="button"
        onClick={() => void handleScan()}
        disabled={scanning}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {!scanning && <Layers className="w-4 h-4" />}
        {scanning ? 'Scanning…' : 'Scan my library'}
      </button>

      {scanning && (
        <ScanProgressBanner
          message={triageScanStage(scanWaitSec)}
          waitSec={scanWaitSec}
        />
      )}

      {scanSummary && <p className="text-sm text-brand-400/90">{scanSummary}</p>}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-muted text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-muted text-sm border border-dashed border-warm rounded-lg p-6 text-center">
          No suggestions waiting. Scan after you have photos in Memory (upload in Studio or run{' '}
          <code className="text-brand-400">make seed-demo</code>).
        </p>
      )}

      {items.length > 0 && (
        <p className="text-xs text-muted uppercase tracking-wide">Waiting for your decision</p>
      )}

      <ul className="space-y-4">
        {items.map((item) => {
          const affectedIds = entryIdsForProposal(item);
          const deleteTarget =
            item.proposedAction.type === 'delete_entry' ? affectedIds[0] : undefined;
          return (
          <li
            key={item.id}
            className="rounded-xl border border-warm bg-surface-1 p-4 space-y-3"
          >
            <ProposalThumbnails
              entryIds={affectedIds}
              previews={previews}
              highlightDeleteId={deleteTarget}
            />
            <p className="text-sm text-white leading-relaxed">{describeProposal(item)}</p>
            <HitlReasoningCallout reasoning={item.agentReasoning} />
            {item.proposedAction.type === 'delete_entry' && (
              <p className="text-xs text-red-300/80 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Permanent delete if you approve
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={acting === item.id}
                onClick={() => void handleDecision(item.id, 'approve')}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-600/90 text-white text-sm font-medium hover:bg-brand-500 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Yes, do this
              </button>
              <button
                type="button"
                disabled={acting === item.id}
                onClick={() => void handleDecision(item.id, 'reject')}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-warm text-stone-300 text-sm hover:bg-surface-3 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> No thanks
              </button>
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
};
