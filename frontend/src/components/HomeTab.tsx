/**
 * HomeTab — Editorial photo-first home (luxury darkroom, not SaaS dashboard).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ImageIcon,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { AnalyzingOverlay } from './AnalyzingOverlay';
import { InlineAlertBanner } from './InlineAlertBanner';
import { LibraryBackdrop } from './LibraryBackdrop';
import { PhotoMat } from './PhotoMat';
import { useCountUp } from '../hooks/useCountUp';
import { formatSkillLabel } from '../lib/formatSkillLabel';
import { fetchAestheticProfile, fetchPortfolio, fetchPortfolioTrends } from '../services/memoryClient';
import { analyzePhoto } from '../services/agentClient';
import type { AppTab } from '../config/navConfig';
import type { AnalysisResult } from '../types';
import type { Assignment, UserMode } from '../types/practice';
import type { AestheticProfileSummary, PortfolioListItem, PortfolioTrendsResponse } from '../types/memory';

interface Props {
  mode: UserMode;
  activeAssignment: Assignment | null;
  onNavigate: (tab: AppTab) => void;
  onOpenSettings: () => void;
  onAnalysisComplete?: (result: AnalysisResult, imageUrl: string, filename: string) => void;
}

const EXAMPLE_PHOTO = {
  url: 'https://picsum.photos/seed/iris-home-hero/1200/800',
  sceneDescription: 'Golden hour light streams through autumn trees, casting long shadows across a winding path.',
  overallAverage: 7.4,
  glassBoxSummary: 'Strong leading lines draw the eye through the frame toward the light source.',
};

export const HomeTab: React.FC<Props> = ({
  activeAssignment,
  onNavigate,
  onAnalysisComplete,
}) => {
  const [bestPhoto, setBestPhoto] = useState<PortfolioListItem | null>(null);
  const [earliestPhoto, setEarliestPhoto] = useState<PortfolioListItem | null>(null);
  const [contactSheet, setContactSheet] = useState<PortfolioListItem[]>([]);
  const [profile, setProfile] = useState<AestheticProfileSummary | null>(null);
  const [trends, setTrends] = useState<PortfolioTrendsResponse | null>(null);
  const [portfolioTotal, setPortfolioTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingImageUrl, setAnalyzingImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzeWaitSec, setAnalyzeWaitSec] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolio, oldestPortfolio, aesthetic, trendData] = await Promise.all([
        fetchPortfolio({ limit: 12 }),
        fetchPortfolio({ limit: 5, sortOrder: 'asc' }).catch(() => ({ entries: [], total: 0 })),
        fetchAestheticProfile().catch(() => null),
        fetchPortfolioTrends(6).catch(() => null),
      ]);

      if (portfolio.entries.length > 0) {
        const sorted = [...portfolio.entries].sort((a, b) => b.overallAverage - a.overallAverage);
        setBestPhoto(sorted[0]);
        setContactSheet(portfolio.entries.slice(0, 10));
        const validOldest = oldestPortfolio.entries.find(
          (e) => e.imageUrl && e.overallAverage > 0,
        );
        setEarliestPhoto(validOldest ?? null);
      } else {
        setBestPhoto(null);
        setEarliestPhoto(null);
        setContactSheet([]);
      }
      setPortfolioTotal(portfolio.total);
      setProfile(aesthetic);
      setTrends(trendData);
    } catch {
      /* shell remains */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!uploading) {
      setAnalyzeWaitSec(0);
      return;
    }
    const tick = window.setInterval(() => setAnalyzeWaitSec((s) => s + 1), 1000);
    return () => window.clearInterval(tick);
  }, [uploading]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (analyzingImageUrl) URL.revokeObjectURL(analyzingImageUrl);
    setAnalyzingImageUrl(null);
    setUploading(false);
  }, [analyzingImageUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploading(true);
    setAnalyzingImageUrl(previewUrl);
    setUploadError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await analyzePhoto({
        imageFile: file,
        assignmentId: activeAssignment?.id,
        signal: controller.signal,
      });
      onAnalysisComplete?.(result, previewUrl, file.name);
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setAnalyzingImageUrl(null);
      if (err instanceof Error && err.name === 'AbortError') {
        setUploadError('Analysis cancelled.');
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } finally {
      abortRef.current = null;
      setUploading(false);
      setAnalyzingImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isReturningUser = bestPhoto !== null;
  const photoCount = profile?.photoCount ?? 0;

  const displayPhoto = isReturningUser
    ? {
        url: bestPhoto!.imageUrl,
        sceneDescription: bestPhoto!.sceneDescription || 'Your photograph',
        overallAverage: bestPhoto!.overallAverage,
        glassBoxSummary: bestPhoto!.glassBoxSummary?.[0] || '',
      }
    : EXAMPLE_PHOTO;

  const animatedScore = useCountUp(displayPhoto.overallAverage, 900, imageLoaded);

  const bestTrend = trends?.dimensions?.find(
    (d) => d.delta != null && d.delta > 0 && ['composition', 'lighting', 'overall'].includes(d.key),
  );
  const trendDelta = bestTrend?.delta ?? null;
  const trendLabel = bestTrend?.label ?? null;

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [displayPhoto.url]);

  useEffect(() => {
    if (imageLoaded || imageError) return;
    const timeout = window.setTimeout(() => setImageError(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [displayPhoto.url, imageLoaded, imageError]);

  const showGrowth =
    isReturningUser &&
    earliestPhoto &&
    bestPhoto &&
    earliestPhoto.id !== bestPhoto.id;

  return (
    <>
      {isReturningUser && contactSheet.length > 0 && (
        <LibraryBackdrop
          photos={contactSheet.map((p) => ({ id: p.id, imageUrl: p.imageUrl }))}
        />
      )}

      {uploading && analyzingImageUrl && (
        <AnalyzingOverlay
          imageUrl={analyzingImageUrl}
          waitSec={analyzeWaitSec}
          onCancel={cancelUpload}
        />
      )}

      <div className="relative z-10 space-y-12 pb-8">
        {uploadError && (
          <InlineAlertBanner message={uploadError} onDismiss={() => setUploadError(null)} />
        )}

        {/* Hero */}
        <div className="relative overflow-hidden bg-photo-black -mx-3 md:-mx-6 rounded-none md:rounded-2xl md:mx-0">
          <div
            className={`relative ${
              imageError ? 'h-[min(40vh,480px)] min-h-[280px]' : 'h-[min(70vh,720px)] min-h-[420px]'
            }`}
          >
            {imageError ? (
              <div className="absolute inset-0 bg-surface-2 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <ImageIcon className="w-12 h-12 text-stone-600" />
                <p className="text-sm text-muted max-w-xs">
                  Couldn&apos;t load this preview — your library is still here. Upload or open My Work.
                </p>
              </div>
            ) : (
              <>
                <img
                  src={displayPhoto.url}
                  alt={displayPhoto.sceneDescription}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(true);
                  }}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-surface-2 animate-pulse flex items-center justify-center z-10">
                    <ImageIcon className="w-12 h-12 text-stone-600" />
                  </div>
                )}
              </>
            )}
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-canvas via-canvas/50 to-transparent pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-auto md:max-w-lg">
              <div className="backdrop-blur-md bg-canvas/80 border border-warm/60 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500 shadow-lg score-badge">
                    <span className="text-2xl font-bold text-on-brand tabular-nums font-serif">
                      {animatedScore.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-on-brand/70">/ 10</span>
                  </div>
                  <div>
                    <p className="text-sm font-serif font-semibold text-stone-100">
                      {isReturningUser ? 'Your strongest work' : 'Glass Box example'}
                    </p>
                    <p className="text-xs text-muted">
                      {isReturningUser
                        ? `${portfolioTotal} photo${portfolioTotal === 1 ? '' : 's'} in your library`
                        : 'This is what Iris sees'}
                    </p>
                  </div>
                </div>

                {displayPhoto.glassBoxSummary && (
                  <p
                    className="text-sm text-stone-300 leading-relaxed mb-5 line-clamp-2 score-badge"
                    style={{ animationDelay: '80ms' }}
                  >
                    {displayPhoto.glassBoxSummary}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Upload photo
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('practice')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-warm text-stone-200 font-medium hover:bg-surface-2 transition-colors"
                  >
                    Continue practice
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Context row */}
        {!loading && (
          <div className="max-w-4xl mx-auto px-1 space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted text-center">At a glance</p>
            <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-warm bg-surface-1/80 p-4 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-brand-500/15 border border-brand-500/30 shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5 text-brand-400" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-brand-400/90 uppercase tracking-wider mb-1">
                  Score trend
                </p>
                {trendDelta != null && trendLabel ? (
                  <>
                    <p className="text-sm font-serif text-white">
                      {trendLabel} up +{trendDelta.toFixed(1)} pts
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Out of 10 · vs your earlier uploads
                    </p>
                  </>
                ) : photoCount > 0 ? (
                  <>
                    <p className="text-sm font-serif text-white">{photoCount} photos in your library</p>
                    <p className="text-xs text-muted mt-0.5">Upload a few more to see score trends</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-serif text-white">Your scores over time</p>
                    <p className="text-xs text-muted mt-0.5">Each photo gets five scores out of 10</p>
                  </>
                )}
                {trends && trends.points.length >= 2 && !trends.insufficientData && (
                  <div className="mt-2">
                    <div className="h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends.points}>
                          <Line
                            type="monotone"
                            dataKey="overall"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted mt-1">Overall score · recent uploads</p>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 flex items-start gap-4 ${
                activeAssignment ? 'border-brand-500/40 bg-brand-500/10' : 'border-warm bg-surface-1/80'
              }`}
            >
              <div className="p-2 rounded-lg bg-brand-500/15 border border-brand-500/30 shrink-0 mt-0.5">
                <Target className="w-5 h-5 text-brand-400" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-brand-400/90 uppercase tracking-wider mb-1">
                  Practice challenge
                </p>
                {activeAssignment ? (
                  <>
                    <p className="text-sm font-serif text-white">
                      {formatSkillLabel(activeAssignment.targetSkill || 'General')}
                    </p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                      {activeAssignment.brief}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-serif text-white">No active challenge</p>
                    <p className="text-xs text-muted mt-0.5">
                      Short assignments to practise one skill at a time
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium shrink-0 self-center"
              >
                {activeAssignment ? 'Continue →' : 'Browse →'}
              </button>
            </div>
            </div>
          </div>
        )}

        {/* Growth comparison */}
        {showGrowth && (
          <section className="max-w-5xl mx-auto px-1">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl text-white mb-2">Your growth</h2>
              <p className="text-muted text-sm">
                From an early frame to your strongest — Photo #{portfolioTotal}
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-10">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-muted mb-3">Then</p>
                <PhotoMat variant="contact" aspect="aspect-[4/3]">
                  <img
                    src={earliestPhoto!.imageUrl}
                    alt="Earlier work"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </PhotoMat>
                <p className="mt-2 text-sm text-muted flex justify-between">
                  <span>Earlier work</span>
                  <span className="text-stone-300 tabular-nums">{earliestPhoto!.overallAverage.toFixed(1)}</span>
                </p>
              </div>
              <div className="hidden md:flex items-center text-brand-400/60">
                <ArrowRight className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-brand-400/80 mb-3">Now</p>
                <PhotoMat variant="contact" aspect="aspect-[4/3]">
                  <img
                    src={bestPhoto!.imageUrl}
                    alt="Strongest work"
                    className="w-full h-full object-cover ring-1 ring-brand-500/40"
                  />
                </PhotoMat>
                <p className="mt-2 text-sm text-muted flex justify-between">
                  <span>Strongest</span>
                  <span className="text-brand-400 font-semibold tabular-nums">
                    {bestPhoto!.overallAverage.toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
            {trendDelta != null && trendDelta > 0 && (
              <p className="text-center mt-6 text-brand-400 font-medium text-sm">
                <TrendingUp className="w-4 h-4 inline mr-1.5" />
                +{trendDelta.toFixed(1)} in {trendLabel?.toLowerCase()}
              </p>
            )}
          </section>
        )}

        {/* Contact sheet strip */}
        <section className="max-w-6xl mx-auto px-1">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-white">
                {isReturningUser ? 'Contact sheet' : 'Example critiques'}
              </h2>
              <p className="text-muted text-sm mt-1">
                {isReturningUser ? 'Recent frames from your library' : 'Upload yours to begin'}
              </p>
            </div>
            {isReturningUser && (
              <button
                type="button"
                onClick={() => onNavigate('work')}
                className="text-sm text-brand-400 hover:text-brand-300 font-medium shrink-0"
              >
                Open library →
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shrink-0 w-56 h-40 rounded-xl bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : contactSheet.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {contactSheet.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onNavigate('work')}
                  className="shrink-0 w-52 sm:w-60 snap-start group text-left"
                >
                  <PhotoMat variant="contact" className="transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="aspect-[3/4] relative">
                      <img
                        src={photo.imageUrl}
                        alt={photo.sceneDescription || 'Photo'}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-brand-500 text-on-brand text-xs font-bold tabular-nums">
                        {photo.overallAverage.toFixed(1)}
                      </span>
                    </div>
                  </PhotoMat>
                  {photo.sceneDescription && (
                    <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                      {photo.sceneDescription}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-8">
              Upload your first photo to start your contact sheet.
            </p>
          )}
        </section>

        {/* Mentor insight */}
        {profile && photoCount >= 3 && (
          <section className="rounded-xl border border-warm bg-surface-1/80 p-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-brand-500/15 border border-brand-500/30 shrink-0">
                <Sparkles className="w-4 h-4 text-brand-400" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">
                  From your mentor
                </p>
                <p className="text-sm text-stone-300 leading-relaxed font-serif">
                  {profile.dominantTags.length > 0
                    ? `I notice you're drawn to ${profile.dominantTags.slice(0, 2).join(' and ').replace(/_/g, ' ')} work.${
                        trendDelta && trendDelta > 0
                          ? ` Your ${trendLabel?.toLowerCase()} has improved +${trendDelta.toFixed(1)} recently.`
                          : ''
                      }`
                    : "Keep uploading — I'll help you see patterns across your shoots."}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('mentor')}
                  className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 font-medium mt-4"
                >
                  Ask me anything
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload photo"
      />
    </>
  );
};
