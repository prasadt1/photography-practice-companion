/**
 * HomeTab — Photo-first home with layered context.
 *
 * Implements PRODUCT.md principles:
 * - "Photos are the interface" — hero is user's best photo
 * - "Show, then tell" — visual proof before explanation
 * - "Memory makes meaning" — progress and history visible
 *
 * Layout:
 * - Hero: Best recent photo with Glass Box overlay
 * - Context pills: Progress trend + Active assignment
 * - CTAs: Upload New + Continue Practice
 * - Below fold: Recent work strip + Mentor insight
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  ImageIcon,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { AnalyzingOverlay } from './AnalyzingOverlay';
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
  /** Called when upload + analysis completes, with result to show in My Work */
  onAnalysisComplete?: (result: AnalysisResult, imageUrl: string, filename: string) => void;
}

// Example content for new users
const EXAMPLE_PHOTO = {
  url: 'https://picsum.photos/seed/iris-home-hero/1200/800',
  sceneDescription: 'Golden hour light streams through autumn trees, casting long shadows across a winding path.',
  overallAverage: 7.4,
  glassBoxSummary: 'Strong leading lines draw the eye through the frame toward the light source.',
};

export const HomeTab: React.FC<Props> = ({
  mode: _mode,
  activeAssignment,
  onNavigate,
  onAnalysisComplete,
}) => {
  const [bestPhoto, setBestPhoto] = useState<PortfolioListItem | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<PortfolioListItem[]>([]);
  const [profile, setProfile] = useState<AestheticProfileSummary | null>(null);
  const [trends, setTrends] = useState<PortfolioTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingImageUrl, setAnalyzingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch minimal data: 5 photos (1 best + 4 recent), profile, trends
      const [portfolio, aesthetic, trendData] = await Promise.all([
        fetchPortfolio(5),
        fetchAestheticProfile().catch(() => null),
        fetchPortfolioTrends(6).catch(() => null),
      ]);

      if (portfolio.entries.length > 0) {
        // Best photo by score
        const sorted = [...portfolio.entries].sort(
          (a, b) => b.overallAverage - a.overallAverage
        );
        setBestPhoto(sorted[0]);
        // Recent photos (most recent first, excluding best)
        setRecentPhotos(
          portfolio.entries
            .filter((e) => e.id !== sorted[0].id)
            .slice(0, 4)
        );
      }
      setProfile(aesthetic);
      setTrends(trendData);
    } catch {
      // Continue with empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploading(true);
    setAnalyzingImageUrl(previewUrl);

    try {
      const result = await analyzePhoto({
        imageFile: file,
        assignmentId: activeAssignment?.id,
      });
      // Pass result to App to show detailed analysis in My Work
      onAnalysisComplete?.(result, previewUrl, file.name);
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setAnalyzingImageUrl(null);
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setAnalyzingImageUrl(null);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isReturningUser = bestPhoto !== null;
  const photoCount = profile?.photoCount ?? 0;

  // Find best trend for display
  const bestTrend = trends?.dimensions?.find(
    (d) => d.delta != null && d.delta > 0 && (d.key === 'composition' || d.key === 'lighting' || d.key === 'overall')
  );
  const trendDelta = bestTrend?.delta ?? null;
  const trendLabel = bestTrend?.label ?? null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
        <div className="aspect-[16/10] rounded-2xl bg-surface-2 animate-pulse" />
        <div className="flex gap-4">
          <div className="h-16 flex-1 rounded-xl bg-surface-2 animate-pulse" />
          <div className="h-16 flex-1 rounded-xl bg-surface-2 animate-pulse" />
        </div>
      </div>
    );
  }

  const displayPhoto = isReturningUser
    ? {
        url: bestPhoto.imageUrl,
        sceneDescription: bestPhoto.sceneDescription || 'Your photograph',
        overallAverage: bestPhoto.overallAverage,
        glassBoxSummary: bestPhoto.glassBoxSummary?.[0] || '',
      }
    : EXAMPLE_PHOTO;

  return (
    <>
      {/* Glass Box thinking overlay during analysis */}
      {uploading && analyzingImageUrl && (
        <AnalyzingOverlay imageUrl={analyzingImageUrl} />
      )}

      <div className="animate-fadeIn max-w-5xl mx-auto space-y-8">
      {/* Hero Photo with Glass Box overlay */}
      <div className="relative rounded-2xl overflow-hidden border border-warm bg-photo-black shadow-2xl shadow-black/50">
        <div className="relative aspect-[16/10] md:aspect-[2/1] lg:aspect-[21/9]">
          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-surface-2 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-stone-600" />
            </div>
          )}

          {/* Hero image */}
          <img
            src={displayPhoto.url}
            alt={displayPhoto.sceneDescription}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Glass Box panel */}
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md">
            <div className="rounded-xl bg-canvas/90 backdrop-blur-md border border-warm/50 p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-brand-500/15 border border-brand-500/30">
                  <Sparkles className="w-4 h-4 text-brand-400" aria-hidden />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">
                    {isReturningUser ? 'Your strongest work' : 'Glass Box critique'}
                  </p>
                  <p className="text-[10px] text-muted">
                    {isReturningUser
                      ? `From ${photoCount} photo${photoCount === 1 ? '' : 's'} in your library`
                      : 'This is what Iris sees'}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 shadow-md">
                  <span className="text-sm font-bold text-on-brand tabular-nums">
                    {displayPhoto.overallAverage.toFixed(1)}
                  </span>
                </div>
              </div>
              {displayPhoto.glassBoxSummary && (
                <p className="text-sm text-stone-300 leading-relaxed line-clamp-2">
                  {displayPhoto.glassBoxSummary}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context pills: Progress + Assignment */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Progress pill */}
        <div className="rounded-xl border border-warm bg-surface-1 p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-brand-500/15 border border-brand-500/30 shrink-0">
            <TrendingUp className="w-5 h-5 text-brand-400" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            {trendDelta !== null && trendLabel ? (
              <>
                <p className="text-sm font-semibold text-white">
                  {trendLabel} {trendDelta >= 0 ? '+' : ''}{trendDelta.toFixed(1)}
                </p>
                <p className="text-xs text-muted">recent improvement</p>
              </>
            ) : photoCount > 0 ? (
              <>
                <p className="text-sm font-semibold text-white">{photoCount} photos</p>
                <p className="text-xs text-muted">in your library</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">Track your growth</p>
                <p className="text-xs text-muted">Upload photos to see trends</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('work')}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium shrink-0"
          >
            View all →
          </button>
        </div>

        {/* Assignment pill */}
        <div
          className={`rounded-xl border p-4 flex items-center gap-4 ${
            activeAssignment
              ? 'border-brand-500/40 bg-brand-500/10'
              : 'border-warm bg-surface-1'
          }`}
        >
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              activeAssignment
                ? 'bg-brand-500/20 border border-brand-500/40'
                : 'bg-surface-2 border border-warm'
            }`}
          >
            <Target
              className={`w-5 h-5 ${activeAssignment ? 'text-brand-400' : 'text-muted'}`}
              aria-hidden
            />
          </div>
          <div className="flex-1 min-w-0">
            {activeAssignment ? (
              <>
                <p className="text-sm font-semibold text-white truncate">
                  {activeAssignment.targetSkill || 'Active Challenge'}
                </p>
                <p className="text-xs text-muted truncate">{activeAssignment.brief}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">Start a challenge</p>
                <p className="text-xs text-muted">Practice with focused assignments</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className={`text-xs font-medium shrink-0 ${
              activeAssignment
                ? 'text-brand-400 hover:text-brand-300'
                : 'text-muted hover:text-white'
            }`}
          >
            {activeAssignment ? 'Continue →' : 'Browse →'}
          </button>
        </div>
      </div>

      {/* Primary CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload photo"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500 text-on-brand font-semibold text-sm hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-on-brand/30 border-t-on-brand rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" aria-hidden />
              Upload Photo
            </>
          )}
        </button>
        {activeAssignment && (
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-brand-500/50 text-brand-400 font-semibold text-sm hover:bg-brand-500/10 transition-colors"
          >
            <Camera className="w-4 h-4" aria-hidden />
            Shoot Now
          </button>
        )}
      </div>

      {/* Recent Work strip */}
      {recentPhotos.length > 0 && (
        <section className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Recent Work
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('work')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              See all →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onNavigate('work')}
                className="shrink-0 w-32 md:w-40 group"
              >
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-photo-black border border-warm relative">
                  {photo.imageUrl ? (
                    <img
                      src={photo.imageUrl}
                      alt={photo.sceneDescription?.slice(0, 60) || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-stone-600" />
                    </div>
                  )}
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500/90 text-[10px] font-bold text-on-brand tabular-nums shadow">
                    {photo.overallAverage.toFixed(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Mentor insight */}
      {profile && photoCount >= 3 && (
        <section className="rounded-xl border border-warm bg-surface-1 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-500/15 border border-brand-500/30 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-brand-400" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
                Your Mentor
              </p>
              <p className="text-sm text-stone-300 leading-relaxed">
                {profile.dominantTags.length > 0
                  ? `I notice you're drawn to ${profile.dominantTags.slice(0, 2).join(' and ').replace(/_/g, ' ')} work. ${
                      trendDelta && trendDelta > 0
                        ? `Your ${trendLabel?.toLowerCase()} has improved +${trendDelta.toFixed(1)} recently.`
                        : 'Keep uploading to track your growth over time.'
                    }`
                  : 'Keep uploading photos and I\'ll help you understand your aesthetic and track your progress.'}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('mentor')}
                className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 font-medium mt-3"
              >
                Ask me anything
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Empty state for new users */}
      {!isReturningUser && (
        <section className="text-center py-8">
          <p className="text-muted text-sm mb-4">
            This is what Iris sees in a photo. Upload yours to get started.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('work')}
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium text-sm"
          >
            Upload your first photo
            <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </section>
      )}
    </div>
    </>
  );
};
