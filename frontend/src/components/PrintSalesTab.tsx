import React, { useCallback, useEffect, useState } from 'react';
import { Check, ImageIcon, Loader2, Settings, ShoppingBag, X } from 'lucide-react';
import { ScanProgressBanner } from './ScanProgressBanner';
import { TabEmptyState } from './TabEmptyState';
import { printScanStage } from '../lib/scanLoadingStages';
import { HitlReasoningCallout } from './HitlReasoningCallout';
import { friendlyErrorMessage } from '../lib/friendlyError';
import { listingFromApproval } from '../lib/printListingPayload';
import { fetchPortfolio } from '../services/memoryClient';
import {
  decidePrintApproval,
  fetchPrintPending,
  runPrintSalesScan,
} from '../services/printSalesClient';
import type { UserMode } from '../types/practice';
import type { PendingApproval } from '../types/triage';
import type { PortfolioListItem } from '../types/memory';

interface Props {
  mode: UserMode;
  onGoToMentor?: () => void;
  onOpenSettings?: () => void;
}

export const PrintSalesTab: React.FC<Props> = ({ mode, onGoToMentor, onOpenSettings }) => {
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [previews, setPreviews] = useState<Map<string, PortfolioListItem>>(new Map());
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanWaitSec, setScanWaitSec] = useState(0);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanSummary, setScanSummary] = useState<string | null>(null);

  const loadPreviews = useCallback(async () => {
    try {
      const data = await fetchPortfolio(100);
      const map = new Map<string, PortfolioListItem>();
      for (const e of data.entries) {
        map.set(e.id, e);
      }
      setPreviews(map);
    } catch {
      /* optional */
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPrintPending();
      setItems(data.items);
      const nextPrices: Record<string, number> = {};
      for (const item of data.items) {
        nextPrices[item.id] = listingFromApproval(item).suggestedListPrice;
      }
      setPrices(nextPrices);
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
    setScanning(true);
    setError(null);
    try {
      const result = await runPrintSalesScan('etsy');
      const created = result.proposalsCreated?.length ?? 0;
      const cleared = result.supersededPending ?? 0;
      setScanSummary(
        cleared > 0
          ? `Replaced ${cleared} old draft(s). ${created} new listing proposal(s) ready.`
          : `${created} listing proposal(s) ready — approve each one individually.`,
      );
      setItems(result.pending?.items ?? []);
      const nextPrices: Record<string, number> = {};
      for (const item of result.pending?.items ?? []) {
        nextPrices[item.id] = listingFromApproval(item).suggestedListPrice;
      }
      setPrices(nextPrices);
      void loadPreviews();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setScanning(false);
    }
  };

  const handleApprove = async (item: PendingApproval) => {
    const draft = listingFromApproval(item);
    const edited = prices[item.id] ?? draft.suggestedListPrice;
    const priceChanged = Math.abs(edited - draft.suggestedListPrice) > 0.009;
    setActing(item.id);
    try {
      await decidePrintApproval(
        item.id,
        priceChanged ? 'modify' : 'approve',
        priceChanged ? { suggestedListPrice: edited, list_price: edited } : undefined,
      );
      setItems((prev) => prev.filter((p) => p.id !== item.id));
      setScanSummary(
        priceChanged
          ? `Listed on ${draft.marketplace} at $${edited.toFixed(2)} (your price).`
          : `Listed on ${draft.marketplace} at $${edited.toFixed(2)}.`,
      );
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: string) => {
    setActing(id);
    try {
      await decidePrintApproval(id, 'reject');
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setActing(null);
    }
  };

  if (mode !== 'working_pro') {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-extrabold text-white">List for Sale</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            Working pros get per-listing drafts with your approval before anything is saved. Hobbyists
            can still ask Ask Mentor which shots might sell as prints.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-warm bg-surface-1 p-5 text-left space-y-3">
          <p className="text-[10px] font-bold uppercase text-amber-400/90 tracking-wide">
            Example listing draft
          </p>
          <p className="text-sm font-semibold text-white">Coastal light — limited print</p>
          <p className="text-xs text-muted line-clamp-2">
            Archival matte print, signed. Suggested $45 — you approve title, copy, and price on each
            card.
          </p>
          <p className="text-xs text-muted">
            Portfolio score 8.2/10 · Etsy-style draft (saved in your library only, not live API)
          </p>
        </div>
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand font-semibold text-sm hover:bg-brand-400"
          >
            <Settings className="w-4 h-4" />
            Switch to Working pro
          </button>
        )}
        {onGoToMentor && (
          <p className="text-sm text-muted">
            Or{' '}
            <button
              type="button"
              onClick={onGoToMentor}
              className="text-brand-400 hover:text-brand-300 underline"
            >
              ask Ask Mentor
            </button>{' '}
            which photos might sell.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">List for Sale</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Approve marketplace listings</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          I draft listing copy and price — nothing goes live until you approve each card one by one.
          You can also ask in Ask Mentor:{' '}
          <em className="text-muted">&quot;Which photos should I list on Etsy?&quot;</em>
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleScan()}
        disabled={scanning}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {!scanning && <ShoppingBag className="w-4 h-4" />}
        {scanning ? 'Drafting listings…' : 'Draft listing proposals'}
      </button>

      {scanning && (
        <ScanProgressBanner
          message={printScanStage(scanWaitSec)}
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
        <TabEmptyState
          icon={ShoppingBag}
          title="No listing drafts yet"
          description="I draft Etsy-style titles, descriptions, and prices from your portfolio — nothing goes live until you approve each card."
          steps={[
            'Switch to Working pro in Settings if you sell prints',
            'Upload strong portfolio photos in Studio',
            'Tap Draft listing proposals, or ask Mentor which photos to list',
          ]}
          action={
            onGoToMentor
              ? { label: 'Ask Mentor', onClick: onGoToMentor }
              : undefined
          }
        />
      )}

      <ul className="space-y-5">
        {items.map((item) => {
          const draft = listingFromApproval(item);
          const entry = previews.get(draft.portfolioEntryId);
          const price = prices[item.id] ?? draft.suggestedListPrice;
          return (
            <li
              key={item.id}
              className="rounded-xl border border-warm bg-surface-1 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-4 p-4">
                <div className="shrink-0 w-full sm:w-28 aspect-[3/4] sm:aspect-square rounded-lg overflow-hidden bg-black border border-warm">
                  {entry?.imageUrl ? (
                    <img
                      src={entry.imageUrl}
                      alt={entry.sceneDescription?.slice(0, 80) || draft.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-stone-600 min-h-[80px]">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400/90">
                      {draft.marketplace}
                    </span>
                    {entry?.overallAverage != null && (
                      <span className="text-[10px] text-muted">
                        Portfolio {entry.overallAverage}/10
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{draft.title}</h3>
                  <p className="text-xs text-muted line-clamp-3">{draft.description}</p>
                  <HitlReasoningCallout reasoning={item.agentReasoning} />
                  <label
                    htmlFor={`price-${item.id}`}
                    className="flex items-center gap-2 text-sm text-stone-300"
                  >
                    <span className="shrink-0">Price ({draft.currency})</span>
                    <input
                      id={`price-${item.id}`}
                      type="number"
                      min={1}
                      step={0.5}
                      value={price}
                      disabled={acting === item.id}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [item.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24 rounded-lg bg-canvas-elevated border border-warm px-2 py-1 text-white text-sm"
                      aria-label={`Listing price in ${draft.currency}`}
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 p-3 pt-0 border-t border-warm/80">
                <button
                  type="button"
                  disabled={acting === item.id || price < 1}
                  onClick={() => void handleApprove(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-brand-600/90 text-white text-sm font-medium hover:bg-brand-500 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Approve listing
                </button>
                <button
                  type="button"
                  disabled={acting === item.id}
                  onClick={() => void handleReject(item.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-warm text-stone-300 text-sm hover:bg-surface-3 disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted text-center">
        Approved listings are saved to your library — not sent to Etsy or another shop in this
        preview.
      </p>
    </div>
  );
};
