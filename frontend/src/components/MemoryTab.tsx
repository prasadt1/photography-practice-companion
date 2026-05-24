import React, { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ImageIcon, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { fetchAestheticProfile, fetchPortfolio } from '../services/memoryClient';
import type { AestheticProfileSummary, PortfolioListItem } from '../types/memory';

const SCORE_LABELS: { key: keyof AestheticProfileSummary['averageScores']; label: string }[] = [
  { key: 'composition', label: 'Composition' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'technique', label: 'Technique' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'subject_impact', label: 'Subject' },
];

export const MemoryTab: React.FC = () => {
  const [entries, setEntries] = useState<PortfolioListItem[]>([]);
  const [profile, setProfile] = useState<AestheticProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [portfolio, aesthetic] = await Promise.all([
        fetchPortfolio(),
        fetchAestheticProfile(),
      ]);
      setEntries(portfolio.entries);
      setProfile(aesthetic);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load memory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-3" />
        <p className="text-sm">Loading portfolio from MongoDB…</p>
      </div>
    );
  }

  if (error) {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return (
      <div className="max-w-lg mx-auto p-8 rounded-2xl bg-slate-800/50 border border-rose-500/40 text-center">
        <p className="text-rose-400 text-sm mb-4">{error}</p>
        <p className="text-slate-500 text-xs mb-4">
          {isLocal ? (
            <>
              Ensure <code className="text-brand-400">make api-dev</code> is running on port 8081.
            </>
          ) : (
            <>Check the Coach API is up and CORS allows this site (Cloud Run + Firebase).</>
          )}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-slate-900 text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Memory</h2>
          <p className="text-slate-400 text-sm">
            Persistent portfolio from Atlas — every Studio critique is remembered.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {profile && profile.photoCount > 0 && (
        <section className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Aesthetic snapshot
            </h3>
            <span className="text-xs text-slate-500">
              ({profile.photoCount} recent photo{profile.photoCount === 1 ? '' : 's'})
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-2">Dominant tags</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.dominantTags.length > 0 ? (
                  profile.dominantTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-600"
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-2">Average scores</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {SCORE_LABELS.map(({ key, label }) => (
                  <li key={key} className="flex justify-between gap-4">
                    <span>{label}</span>
                    <span className="font-mono text-brand-400">
                      {profile.averageScores[key]?.toFixed(1) ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-2">Consistency</p>
              <p className="text-3xl font-bold text-emerald-400">
                {profile.stylisticConsistencyScore != null
                  ? `${Math.round(profile.stylisticConsistencyScore * 100)}%`
                  : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                How steady your dimension scores are across recent work.
              </p>
            </div>
          </div>
        </section>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-700">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No portfolio entries yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            Upload a photo in Studio — it will appear here after analysis.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => {
            const expanded = expandedId === entry.id;
            let when = '';
            try {
              when = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
            } catch {
              when = '';
            }
            return (
              <article
                key={entry.id}
                className="rounded-2xl bg-slate-800/50 border border-slate-700 overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  className="text-left flex flex-col flex-1"
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                >
                  <div className="aspect-[4/3] bg-black relative">
                    {entry.imageUrl ? (
                      <img
                        src={entry.imageUrl}
                        alt={entry.sceneDescription?.slice(0, 80) || 'Portfolio photo'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-600">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/90 text-brand-400 text-xs font-bold border border-slate-600">
                      {entry.overallAverage}/10
                    </span>
                  </div>
                  <div className="p-4 flex-1">
                    {entry.sceneDescription && (
                      <p
                        className={`text-sm text-slate-300 leading-snug ${
                          expanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {entry.sceneDescription}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-2 uppercase">{when}</p>
                    {entry.aestheticTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.aestheticTags.slice(0, expanded ? 12 : 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {expanded && entry.glassBoxSummary.length > 0 && (
                      <ul className="mt-3 text-xs text-slate-400 space-y-1 list-disc list-inside border-t border-slate-700 pt-3">
                        {entry.glassBoxSummary.map((line) => (
                          <li key={line.slice(0, 40)}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
