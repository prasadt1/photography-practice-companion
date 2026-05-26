/**
 * MyWorkTab — Merged Studio + Memory surface.
 *
 * Default: Gallery of your photos with scores and Glass Box summaries.
 * Upload: Prominent CTA opens upload flow, results integrate back to gallery.
 * Implements "Photos are the interface" — gallery first, upload as action.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronUp, ImageIcon, Plus, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { FilmGrain } from './FilmGrain';
import { TabEmptyState } from './TabEmptyState';
import { apiUnreachableMessage } from '../lib/apiHelp';
import { friendlyErrorMessage } from '../lib/friendlyError';
import { MemoryGridSkeleton } from './SkeletonBlocks';
import { ScoreTrendRow } from './ScoreTrendRow';
import PhotoUploader from './studio/PhotoUploader';
import StudioAnalysisResults from './studio/StudioAnalysisResults';
import { ActivePracticeBanner } from './studio/ActivePracticeBanner';
import { fetchAestheticProfile, fetchPortfolio, fetchPortfolioTrends } from '../services/memoryClient';
import { analyzePhoto } from '../services/agentClient';
import { mapAnalysisResult } from '../lib/mapAnalysisResult';
import type { AnalysisResult } from '../types';
import type {
  AestheticProfileSummary,
  PortfolioListItem,
  PortfolioTrendsResponse,
} from '../types/memory';
import type { Assignment } from '../types/practice';

const TREND_DISPLAY_KEYS = ['composition', 'lighting', 'technique', 'overall'] as const;

const SCORE_LABELS: { key: keyof AestheticProfileSummary['averageScores']; label: string }[] = [
  { key: 'composition', label: 'Composition' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'technique', label: 'Technique' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'subject_impact', label: 'Subject' },
];

/** Pending analysis passed from Home after upload */
interface PendingAnalysis {
  result: AnalysisResult;
  imageUrl: string;
  filename: string;
}

interface MyWorkTabProps {
  activeAssignment?: Assignment | null;
  onAssignmentComplete?: () => void;
  onGoHome?: () => void;
  /** Analysis result from Home upload to show immediately */
  pendingAnalysis?: PendingAnalysis | null;
  onClearPendingAnalysis?: () => void;
}

type ViewMode = 'gallery' | 'upload' | 'analyzing' | 'result';

export const MyWorkTab: React.FC<MyWorkTabProps> = ({
  activeAssignment,
  onAssignmentComplete,
  onGoHome,
  pendingAnalysis,
  onClearPendingAnalysis,
}) => {
  // Gallery state
  const [entries, setEntries] = useState<PortfolioListItem[]>([]);
  const [profile, setProfile] = useState<AestheticProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trends, setTrends] = useState<PortfolioTrendsResponse | null>(null);

  // Upload/analysis state
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('photo.jpg');

  // Handle pending analysis from Home upload
  useEffect(() => {
    if (pendingAnalysis) {
      setResult(pendingAnalysis.result);
      setImageUrl(pendingAnalysis.imageUrl);
      setFilename(pendingAnalysis.filename);
      setViewMode('result');
      // Clear pending analysis after processing so subsequent visits show gallery
      onClearPendingAnalysis?.();
    }
  }, [pendingAnalysis, onClearPendingAnalysis]);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [portfolio, aesthetic, trendData] = await Promise.all([
        fetchPortfolio(),
        fetchAestheticProfile(),
        fetchPortfolioTrends(12).catch(() => null),
      ]);
      setEntries(portfolio.entries);
      setProfile(aesthetic);
      setTrends(trendData);
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  const handleImageSelected = async (file: File, previewUrl: string) => {
    setViewMode('analyzing');
    setResult(null);
    setImageUrl(previewUrl);
    setFilename(file.name);

    try {
      const analysisResult = await analyzePhoto({
        imageFile: file,
        assignmentId: activeAssignment?.id,
      });
      setResult(analysisResult);
      setViewMode('result');
      onAssignmentComplete?.();
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Analysis failed. See console for details.');
      URL.revokeObjectURL(previewUrl);
      setImageUrl(null);
      setViewMode('gallery');
    }
  };

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setResult(null);
    setImageUrl(null);
    setFilename('photo.jpg');
    setViewMode('gallery');
    // Clear pending analysis from Home if any
    onClearPendingAnalysis?.();
    // Refresh gallery to show new photo
    void loadGallery();
  };

  // Upload/Analysis view
  if (viewMode === 'upload' || viewMode === 'analyzing') {
    return (
      <div className="animate-fadeIn relative">
        <FilmGrain className="rounded-2xl" />
        <div className="relative z-10 flex flex-col items-center space-y-8 py-4 md:py-8">
          {activeAssignment && <ActivePracticeBanner assignment={activeAssignment} />}
          <div className="text-center max-w-xl">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-white mb-2">
              {viewMode === 'analyzing' ? 'Analyzing your photo' : 'Upload a photo'}
            </h2>
            {viewMode === 'upload' && (
              <p className="text-muted text-sm">
                Drag and drop or click to browse. JPG, PNG, or WEBP.
              </p>
            )}
          </div>
          <PhotoUploader
            onImageSelected={handleImageSelected}
            isAnalyzing={viewMode === 'analyzing'}
          />
          {viewMode === 'upload' && (
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className="text-sm text-muted hover:text-white underline underline-offset-2"
            >
              Back to gallery
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results view
  if (viewMode === 'result' && result && imageUrl) {
    return (
      <div className="animate-fadeIn relative space-y-4">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to gallery
        </button>
        <div className="relative">
          <FilmGrain className="rounded-2xl" />
          <StudioAnalysisResults
            analysis={mapAnalysisResult(result)}
            imageSrc={imageUrl}
            originalFilename={filename}
            onReset={handleReset}
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="animate-fadeIn space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-surface-2 rounded animate-pulse" aria-hidden />
        <MemoryGridSkeleton />
        <p className="text-sm text-muted text-center">Loading your portfolio…</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-lg mx-auto p-8 rounded-2xl bg-surface-1 border border-rose-500/40 text-center">
        <p className="text-rose-400 text-sm mb-4">{error}</p>
        <p className="text-muted text-xs mb-4">{apiUnreachableMessage()}</p>
        <button
          type="button"
          onClick={() => void loadGallery()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-on-brand text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Gallery view (default)
  return (
    <div className="animate-fadeIn space-y-8">
      {/* Back to Home link */}
      {onGoHome && (
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Home
        </button>
      )}

      {/* Header with upload CTA */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">My Work</h2>
          <p className="text-muted text-sm">
            {entries.length > 0
              ? `${entries.length} photo${entries.length === 1 ? '' : 's'} in your library`
              : 'Your critiqued photos appear here'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadGallery()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-warm text-stone-300 text-sm hover:bg-surface-2"
            aria-label="Refresh gallery"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-500 text-on-brand text-sm font-semibold hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Active assignment banner */}
      {activeAssignment && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-1">
              Active Challenge
            </p>
            <p className="text-sm text-white">{activeAssignment.brief}</p>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('upload')}
            className="shrink-0 px-4 py-2 rounded-lg bg-brand-500 text-on-brand text-sm font-semibold hover:bg-brand-400"
          >
            Upload for this
          </button>
        </div>
      )}

      {/* Compact stats summary (collapsible) */}
      {profile && profile.photoCount > 0 && (
        <details className="group rounded-xl bg-surface-1 border border-warm">
          <summary className="flex items-center justify-between gap-4 p-4 cursor-pointer select-none hover:bg-surface-2/50 transition-colors list-none">
            <div className="flex items-center gap-3 min-w-0">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="text-white font-medium">{profile.photoCount} photos</span>
                <span className="text-warm">·</span>
                <span className="text-stone-300">
                  Avg{' '}
                  <span className="text-amber-400 font-semibold">
                    {profile.averageScores.overall?.toFixed(1) ?? '—'}
                  </span>
                </span>
                {profile.stylisticConsistencyScore != null && (
                  <>
                    <span className="text-warm">·</span>
                    <span className="text-stone-300">
                      <span className="text-brand-400 font-semibold">
                        {Math.round(profile.stylisticConsistencyScore * 100)}%
                      </span>{' '}
                      consistent
                    </span>
                  </>
                )}
                {trends && !trends.insufficientData && trends.dimensions.find(d => d.key === 'overall')?.delta != null && (
                  <>
                    <span className="text-warm">·</span>
                    <span className="text-emerald-400 text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{trends.dimensions.find(d => d.key === 'overall')?.delta?.toFixed(1)} progress
                    </span>
                  </>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform shrink-0" />
          </summary>

          <div className="px-4 pb-4 pt-2 border-t border-warm/60 space-y-4">
            {/* Tags */}
            {profile.dominantTags.length > 0 && (
              <div>
                <p className="text-[10px] text-muted uppercase mb-2">Your style</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.dominantTags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-canvas-elevated text-stone-300 border border-warm"
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Score breakdown */}
            <div className="grid grid-cols-5 gap-2 text-center">
              {SCORE_LABELS.map(({ key, label }) => {
                const val = profile.averageScores[key];
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-[9px] text-muted uppercase truncate">{label}</p>
                    <p className="text-sm font-bold text-amber-400">{val?.toFixed(1) ?? '—'}</p>
                  </div>
                );
              })}
            </div>

            {/* Trends */}
            {trends && !trends.insufficientData && trends.dimensions.length > 0 && (
              <div>
                <p className="text-[10px] text-muted uppercase mb-2">Recent progress</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {trends.dimensions
                    .filter((d) => (TREND_DISPLAY_KEYS as readonly string[]).includes(d.key))
                    .map((d) => (
                      <div key={d.key} className="rounded-lg bg-canvas-elevated/60 p-2 text-center">
                        <p className="text-[9px] text-muted uppercase">{d.label}</p>
                        <p className="text-sm font-semibold text-stone-200">{d.current.toFixed(1)}</p>
                        {d.delta != null && (
                          <p className={`text-[10px] ${d.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {d.delta >= 0 ? '+' : ''}{d.delta.toFixed(1)}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Photo gallery or empty state */}
      {entries.length === 0 ? (
        <TabEmptyState
          icon={ImageIcon}
          title="Your library is empty"
          description="Upload your first photo to get Glass Box critique with scores, tags, and reasoning."
          steps={[
            'Click Upload above',
            'Drop a photo or browse your files',
            'Get detailed critique saved here',
          ]}
          action={{ label: 'Upload your first photo', onClick: () => setViewMode('upload') }}
        />
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
                className="rounded-2xl bg-surface-1 border border-warm overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  className="text-left flex flex-col flex-1"
                  aria-label={`View photo details, score ${entry.overallAverage} out of 10${
                    entry.sceneDescription
                      ? `: ${entry.sceneDescription.slice(0, 60)}`
                      : ''
                  }`}
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                >
                  <div className="p-3 bg-photo-black border-b border-warm/40">
                    <div className="aspect-[4/3] bg-photo-black relative rounded-md overflow-hidden ring-1 ring-warm/60 shadow-inner">
                      {entry.imageUrl ? (
                        <img
                          src={entry.imageUrl}
                          alt={entry.sceneDescription?.slice(0, 120) || 'Portfolio photo'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-stone-600">
                          <ImageIcon className="w-10 h-10" aria-hidden />
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-on-brand text-xs font-bold shadow-md tabular-nums">
                        {entry.overallAverage}/10
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    {entry.sceneDescription && (
                      <p
                        className={`text-sm text-stone-300 leading-snug ${
                          expanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {entry.sceneDescription}
                      </p>
                    )}
                    <p className="text-[10px] text-muted mt-2 uppercase">{when}</p>
                    {entry.glassBoxSummary.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-warm/80">
                        <p className="text-[10px] font-bold uppercase text-brand-400/90 tracking-wide mb-1.5">
                          Glass Box
                        </p>
                        <ul className="space-y-1 text-xs text-muted leading-relaxed" role="list">
                          {(expanded ? entry.glassBoxSummary : entry.glassBoxSummary.slice(0, 1)).map(
                            (line, i) => (
                              <li key={i} className={expanded ? '' : 'line-clamp-2'}>
                                {line}
                              </li>
                            ),
                          )}
                        </ul>
                        {!expanded && entry.glassBoxSummary.length > 0 && (
                          <span className="text-[10px] text-brand-400 mt-1 inline-block">
                            Show critique reasoning
                          </span>
                        )}
                      </div>
                    )}
                    {entry.aestheticTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.aestheticTags.slice(0, expanded ? 12 : 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-canvas-elevated text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
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
