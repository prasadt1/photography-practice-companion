/**
 * HomeTab — Layered homepage: first-visit pitch vs returning personal hero.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ImageIcon,
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
import {
  fetchAestheticProfile,
  fetchPortfolio,
  fetchPortfolioStats,
  fetchPortfolioTrends,
} from '../services/memoryClient';
import { analyzePhoto } from '../services/agentClient';
import type { AppTab } from '../config/navConfig';
import type { AnalysisResult } from '../types';
import type { Assignment, UserMode } from '../types/practice';
import type {
  AestheticProfileSummary,
  PortfolioListItem,
  PortfolioStats,
  PortfolioTrendsResponse,
} from '../types/memory';

interface Props {
  mode: UserMode;
  activeAssignment: Assignment | null;
  /** Demo / shared library scope (no signed-in user). */
  useDemoLibrary?: boolean;
  onNavigate: (tab: AppTab) => void;
  onOpenSettings: () => void;
  onAnalysisComplete?: (result: AnalysisResult, imageUrl: string, filename: string) => void;
}

const PITCH_DISMISS_KEY = 'iris:pitchBandDismissed';

const EXAMPLE_PHOTO = {
  url: 'https://picsum.photos/seed/iris-home-hero/1200/800',
  sceneDescription: 'Golden hour light on rocky foreground with long shadows across the frame.',
  overallAverage: 7.4,
  glassBoxSummary:
    'Strong diagonal leading lines draw the eye through the frame. The golden hour light creates depth, though shadow detail could be lifted in the foreground rocks.',
};

const CAPABILITIES = [
  { title: 'Glass Box Critique', desc: 'Five dimensions scored with visible reasoning' },
  { title: 'Practice Assignments', desc: 'Targeted challenges that build your weakest skills' },
  { title: 'Mentor Chat', desc: 'Portfolio-aware conversation with memory' },
  { title: 'Organize & Tag', desc: 'AI-suggested tags, duplicate detection, your approval' },
] as const;

function mentorInsightText(
  profile: AestheticProfileSummary,
  trendDelta: number | null,
  trendLabel: string | null,
): string {
  if (profile.dominantTags.length > 0) {
    const tags = profile.dominantTags
      .slice(0, 2)
      .join(' and ')
      .replace(/_/g, ' ');
    const trend =
      trendDelta != null && trendDelta > 0 && trendLabel
        ? ` Your ${trendLabel.toLowerCase()} has improved +${trendDelta.toFixed(1)} recently.`
        : '';
    return `I notice you're drawn to ${tags} work.${trend}`;
  }
  return "Keep uploading — I'll help you see patterns across your shoots.";
}

export const HomeTab: React.FC<Props> = ({
  activeAssignment,
  useDemoLibrary = false,
  onNavigate,
  onAnalysisComplete,
}) => {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
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
  const [pitchDismissed, setPitchDismissed] = useState(
    () => localStorage.getItem(PITCH_DISMISS_KEY) === 'true',
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exampleGlassBoxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolioStats, recentPhotos, oldestPortfolio, aesthetic, trendData] = await Promise.all([
        fetchPortfolioStats(),
        fetchPortfolio({ limit: 10, sortBy: 'date', sortOrder: 'desc' }),
        fetchPortfolio({ limit: 5, sortOrder: 'asc' }).catch(() => ({ entries: [], total: 0 })),
        fetchAestheticProfile().catch(() => null),
        fetchPortfolioTrends(6).catch(() => null),
      ]);

      setStats(portfolioStats);
      setBestPhoto(portfolioStats.strongest);
      setPortfolioTotal(portfolioStats.total);
      setContactSheet(recentPhotos.entries);
      setProfile(aesthetic);
      setTrends(trendData);

      const validOldest = oldestPortfolio.entries.find(
        (e) => e.imageUrl && e.overallAverage > 0,
      );
      setEarliestPhoto(validOldest ?? null);
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

  const scrollToDemoCritique = useCallback(() => {
    exampleGlassBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    exampleGlassBoxRef.current?.focus();
  }, []);

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

  const isFirstVisit = !loading && portfolioTotal === 0;
  const isReturning = !loading && portfolioTotal > 0 && bestPhoto != null;

  const heroPhoto = isReturning ? bestPhoto! : null;
  const heroScore = heroPhoto?.overallAverage ?? EXAMPLE_PHOTO.overallAverage;
  const animatedScore = useCountUp(heroScore, 900, imageLoaded);

  const bestTrend = trends?.dimensions?.find(
    (d) => d.delta != null && d.delta > 0 && ['composition', 'lighting', 'overall'].includes(d.key),
  );
  const trendDelta = bestTrend?.delta ?? null;
  const trendLabel = bestTrend?.label ?? null;

  const mentorThreshold = useDemoLibrary ? 1 : 3;
  const showMentorCard = Boolean(profile && portfolioTotal >= mentorThreshold);

  const showGrowth =
    isReturning &&
    earliestPhoto &&
    bestPhoto &&
    earliestPhoto.id !== bestPhoto.id;

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [heroPhoto?.imageUrl]);

  useEffect(() => {
    if (imageLoaded || imageError || !heroPhoto) return;
    const timeout = window.setTimeout(() => setImageError(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [heroPhoto?.imageUrl, imageLoaded, imageError, heroPhoto]);

  const dismissPitchBand = () => {
    localStorage.setItem(PITCH_DISMISS_KEY, 'true');
    setPitchDismissed(true);
  };

  return (
    <>
      {isReturning && contactSheet.length > 0 && (
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

      <div className="relative z-10 space-y-10 pb-8">
        {uploadError && (
          <InlineAlertBanner message={uploadError} onDismiss={() => setUploadError(null)} />
        )}

        {/* First visit: pitch hero */}
        {isFirstVisit && (
          <div className="bg-gradient-to-b from-surface-2 to-canvas rounded-2xl p-8 md:p-12 border border-warm">
            <h1 className="font-serif text-3xl md:text-4xl text-white mb-4 leading-tight">
              Your AI photography mentor —
              <br />
              that remembers every shot you upload.
            </h1>
            <p className="text-stone-400 text-base md:text-lg mb-8 max-w-xl">
              Glass Box critiques on five dimensions, a private library that grows with you,
              practice assignments, and mentor chat.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                Upload your first photo
              </button>
              <button
                type="button"
                onClick={scrollToDemoCritique}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-brand-500 text-brand-400 font-medium hover:bg-brand-500/10 transition-colors"
              >
                See demo critique
              </button>
            </div>
          </div>
        )}

        {/* Returning: full-bleed personal hero */}
        {isReturning && heroPhoto && (
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
                    src={heroPhoto.imageUrl}
                    alt={heroPhoto.sceneDescription || 'Your strongest work'}
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
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-canvas via-canvas/60 to-transparent pointer-events-none" />

              <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-auto md:max-w-md">
                <div className="bg-canvas/90 border border-warm/60 p-6 rounded-xl">
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">
                    Best in your library
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500 shadow-lg score-badge">
                      <span className="text-2xl font-bold text-on-brand tabular-nums font-serif">
                        {animatedScore.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold text-on-brand/70">/ 10</span>
                    </div>
                  </div>
                  <p className="text-sm text-stone-300 mb-2 line-clamp-2">
                    {heroPhoto.sceneDescription || 'Your photograph'}
                  </p>
                  <p className="text-xs text-stone-400 mb-4">
                    {portfolioTotal} photo{portfolioTotal === 1 ? '' : 's'}
                    {stats?.firstUpload ? ` · Member since ${stats.firstUpload}` : ''}
                  </p>
                  {heroPhoto.aestheticTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {heroPhoto.aestheticTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-surface-2 text-stone-300 rounded-md text-xs"
                        >
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
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
        )}

        {/* Slim pitch band (returning) */}
        {isReturning && !pitchDismissed && (
          <div className="flex items-center justify-between bg-surface-1 border border-warm rounded-lg px-4 py-3 max-w-4xl mx-auto">
            <p className="text-stone-400 text-sm">Remembers every shot you upload.</p>
            <button
              type="button"
              onClick={dismissPitchBand}
              className="text-stone-500 hover:text-stone-300 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Elevated mentor card */}
        {isReturning && showMentorCard && profile && (
          <section className="bg-gradient-to-br from-surface-1 to-surface-2 rounded-xl p-6 border border-warm max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">From your mentor</p>
            <p className="text-stone-300 text-base leading-relaxed font-serif mb-4">
              {mentorInsightText(profile, trendDelta, trendLabel)}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('mentor')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 transition-colors"
            >
              Ask me anything
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* First visit: example Glass Box */}
        {isFirstVisit && (
          <div
            ref={exampleGlassBoxRef}
            tabIndex={-1}
            className="bg-surface-1 rounded-xl p-6 border border-warm focus:outline-none focus:ring-2 focus:ring-brand-400 max-w-4xl mx-auto"
          >
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-4">Example Critique</p>
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={EXAMPLE_PHOTO.url}
                alt={EXAMPLE_PHOTO.sceneDescription}
                className="w-full md:w-64 h-48 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-stone-300 text-sm leading-relaxed mb-4">
                  {EXAMPLE_PHOTO.glassBoxSummary}
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded text-sm tabular-nums">
                    Composition 8.2
                  </span>
                  <span className="px-3 py-1 bg-brand-500/10 text-brand-400 rounded text-sm tabular-nums">
                    Lighting 7.8
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* First visit: capabilities grid */}
        {isFirstVisit && (
          <section className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl text-white mb-6">What Iris can do</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {CAPABILITIES.map((cap) => (
                <div key={cap.title} className="bg-surface-1 rounded-xl p-5 border border-warm">
                  <h3 className="text-white text-sm font-medium mb-1">{cap.title}</h3>
                  <p className="text-stone-400 text-xs">{cap.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* At a glance (returning) */}
        {isReturning && !loading && (
          <div className="max-w-4xl mx-auto px-1 space-y-3">
            <p className="text-xs uppercase tracking-widest text-stone-400 text-center">At a glance</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-warm bg-surface-1/80 p-4 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-surface-2 shrink-0 mt-0.5">
                  <TrendingUp className="w-5 h-5 text-brand-400" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                    Score trend
                  </p>
                  {trendDelta != null && trendLabel ? (
                    <>
                      <p className="text-sm font-serif text-white">
                        {trendLabel} up +{trendDelta.toFixed(1)} pts
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Out of 10 · vs your earlier uploads
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-serif text-white">
                        {portfolioTotal} photos in your library
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">Upload a few more to see score trends</p>
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
                      <p className="text-[10px] text-stone-500 mt-1">Overall score · recent uploads</p>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 flex items-start gap-4 ${
                  activeAssignment ? 'border-brand-500/40 bg-brand-500/10' : 'border-warm bg-surface-1/80'
                }`}
              >
                <div className="p-2 rounded-lg bg-surface-2 shrink-0 mt-0.5">
                  <Target className="w-5 h-5 text-brand-400" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                    Practice challenge
                  </p>
                  {activeAssignment ? (
                    <>
                      <p className="text-sm font-serif text-white">
                        {formatSkillLabel(activeAssignment.targetSkill || 'General')}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {activeAssignment.brief}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-serif text-white">No active challenge</p>
                      <p className="text-xs text-stone-400 mt-0.5">
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
              <p className="text-stone-400 text-sm">
                From an early frame to your strongest — {portfolioTotal} photos in your library
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-10">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Then</p>
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
                <p className="mt-2 text-sm text-stone-400 flex justify-between">
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
                <p className="mt-2 text-sm text-stone-400 flex justify-between">
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

        {/* Contact sheet */}
        {isReturning && (
          <section className="max-w-6xl mx-auto px-1">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-white">Contact sheet</h2>
                <p className="text-stone-400 text-sm mt-1">Recent frames from your library</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-on-brand text-sm font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('work')}
                  className="text-sm text-brand-400 hover:text-brand-300 font-medium shrink-0"
                >
                  Open library →
                </button>
              </div>
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
                      <p className="mt-2 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                        {photo.sceneDescription}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : null}
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
