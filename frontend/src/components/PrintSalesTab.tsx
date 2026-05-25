import React, { useCallback, useEffect, useState } from 'react';
import { Check, ImageIcon, Loader2, ShoppingBag, X } from 'lucide-react';
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
}

export const PrintSalesTab: React.FC<Props> = ({ mode, onGoToMentor }) => {
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [previews, setPreviews] = useState<Map<string, PortfolioListItem>>(new Map());
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
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
      setError(e instanceof Error ? e.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void loadPreviews();
  }, [refresh, loadPreviews]);

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
      setError(e instanceof Error ? e.message : 'Scan failed');
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
      setError(e instanceof Error ? e.message : 'Approve failed');
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
      setError(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setActing(null);
    }
  };

  if (mode !== 'working_pro') {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-slate-400">
          Print Sales is for the <strong className="text-slate-200">Working pro</strong> persona.
        </p>
        <p className="text-sm text-slate-500">
          Switch persona at the top, or ask in{' '}
          {onGoToMentor ? (
            <button
              type="button"
              onClick={onGoToMentor}
              className="text-brand-400 underline hover:text-brand-300"
            >
              Mentor
            </button>
          ) : (
            'Mentor'
          )}{' '}
          after switching — the orchestrator routes to the print_sales sub-agent.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Print Sales</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Approve marketplace listings</h1>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          The <strong className="text-slate-300">print_sales</strong> sub-agent drafts listings —
          nothing publishes until you approve each card (no batch approve). You can also ask Mentor:{' '}
          <em className="text-slate-400">“Which photos should I list on Etsy?”</em>
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleScan()}
        disabled={scanning}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-500 text-slate-900 font-semibold hover:bg-brand-400 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
        {scanning ? 'Drafting listings…' : 'Draft listing proposals'}
      </button>

      {scanSummary && <p className="text-sm text-emerald-400/90">{scanSummary}</p>}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-slate-500 text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg p-6 text-center">
          No drafts waiting. Run <strong className="text-slate-400">Draft listing proposals</strong>{' '}
          or use Mentor (working pro) to create proposals via the print_sales agent.
        </p>
      )}

      <ul className="space-y-5">
        {items.map((item) => {
          const draft = listingFromApproval(item);
          const entry = previews.get(draft.portfolioEntryId);
          const price = prices[item.id] ?? draft.suggestedListPrice;
          return (
            <li
              key={item.id}
              className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-4 p-4">
                <div className="shrink-0 w-full sm:w-28 aspect-[4/3] sm:aspect-square rounded-lg overflow-hidden bg-black border border-slate-600">
                  {entry?.imageUrl ? (
                    <img
                      src={entry.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600 min-h-[80px]">
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
                      <span className="text-[10px] text-slate-500">
                        Portfolio {entry.overallAverage}/10
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{draft.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3">{draft.description}</p>
                  <p className="text-xs text-slate-500 italic">{item.agentReasoning}</p>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="shrink-0">Price ({draft.currency})</span>
                    <input
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
                      className="w-24 rounded-lg bg-slate-900 border border-slate-600 px-2 py-1 text-white text-sm"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 p-3 pt-0 border-t border-slate-700/80">
                <button
                  type="button"
                  disabled={acting === item.id || price < 1}
                  onClick={() => void handleApprove(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-600/90 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Approve listing
                </button>
                <button
                  type="button"
                  disabled={acting === item.id}
                  onClick={() => void handleReject(item.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-slate-500 text-center">
        Approved listings are saved to MongoDB <code className="text-brand-400">print_sales</code>{' '}
        — not sent to a real marketplace API in this demo.
      </p>
    </div>
  );
};
