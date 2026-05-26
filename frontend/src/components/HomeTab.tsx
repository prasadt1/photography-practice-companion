import React, { useCallback, useEffect, useState } from 'react';
import {
  Aperture,
  Focus,
  LayoutGrid,
  Layers,
  MessageCircle,
  Settings,
  Store,
} from 'lucide-react';
import { BRAND } from '../config/brand';
import { fetchAestheticProfile, fetchPortfolio } from '../services/memoryClient';
import { fetchPrintPending } from '../services/printSalesClient';
import { fetchPendingApprovals } from '../services/triageClient';
import type { AppTab } from '../config/navConfig';
import type { Assignment, UserMode } from '../types/practice';
import type { AestheticProfileSummary } from '../types/memory';

interface Props {
  mode: UserMode;
  activeAssignment: Assignment | null;
  onNavigate: (tab: AppTab) => void;
  onOpenSettings: () => void;
}

export const HomeTab: React.FC<Props> = ({
  mode,
  activeAssignment,
  onNavigate,
  onOpenSettings,
}) => {
  const [profile, setProfile] = useState<AestheticProfileSummary | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [pendingLabels, setPendingLabels] = useState(0);
  const [pendingListings, setPendingListings] = useState(0);

  const load = useCallback(async () => {
    try {
      const [portfolio, aesthetic, triage, print] = await Promise.all([
        fetchPortfolio(48),
        fetchAestheticProfile().catch(() => null),
        fetchPendingApprovals('triage').catch(() => ({ items: [], total: 0 })),
        mode === 'working_pro'
          ? fetchPrintPending().catch(() => ({ items: [], total: 0 }))
          : Promise.resolve({ items: [], total: 0 }),
      ]);
      setPhotoCount(aesthetic?.photoCount ?? portfolio.total);
      setProfile(aesthetic);
      setPendingLabels(triage.total);
      setPendingListings(print.total);
    } catch {
      /* home still usable */
    }
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const consistency =
    profile?.stylisticConsistencyScore != null
      ? `${Math.round(profile.stylisticConsistencyScore * 100)}% consistency`
      : null;

  return (
    <div className="animate-fadeIn space-y-5 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400/90 mb-1">
            {BRAND.name}
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-white">Your studio</h1>
          <p className="text-muted text-sm mt-2 leading-relaxed">
            {photoCount > 0
              ? `${photoCount} photo${photoCount === 1 ? '' : 's'} in your library`
              : 'Upload your first photo to get started'}
            {consistency ? ` · ${consistency}` : ''}
          </p>
          <p className="text-muted/80 text-xs mt-2 leading-relaxed">
            Built for photographers who want memory, not another chatbot.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-lg border border-warm text-muted hover:text-white hover:bg-surface-2"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {mode === 'hobbyist' && (
        <HomeCard
          icon={Store}
          title="Selling prints? (Working pro)"
          description="Switch to Working pro in Settings to draft Etsy-style listings from your portfolio — each one needs your approval."
          cta="Open Settings"
          onClick={onOpenSettings}
        />
      )}

      {mode === 'working_pro' && (
        <HomeCard
          icon={Store}
          title="Listings to approve"
          badge={pendingListings > 0 ? pendingListings : undefined}
          description={
            pendingListings > 0
              ? `I drafted ${pendingListings} marketplace listing${pendingListings === 1 ? '' : 's'} for your review.`
              : 'Draft listing proposals from your portfolio when you are ready.'
          }
          cta={pendingListings > 0 ? 'Review now' : 'Draft proposals'}
          onClick={() => onNavigate('print')}
          highlight
        />
      )}

      {activeAssignment ? (
        <HomeCard
          icon={Focus}
          title="Continue practice"
          description={activeAssignment.brief}
          cta="Open assignment"
          onClick={() => onNavigate('practice')}
          highlight={mode === 'hobbyist'}
        />
      ) : (
        <HomeCard
          icon={Focus}
          title={mode === 'hobbyist' ? 'Start practice' : 'Improve consistency'}
          description="I'll suggest a focused assignment based on your recent critiques."
          cta="My Practice"
          onClick={() => onNavigate('practice')}
          highlight={mode === 'hobbyist'}
        />
      )}

      <HomeCard
          icon={Aperture}
          title="Critique a photo"
        description="Upload for scores and Glass Box reasoning — saved to My Work."
        cta="My Studio"
        onClick={() => onNavigate('work')}
      />

      <HomeCard
          icon={LayoutGrid}
          title={mode === 'working_pro' ? 'Portfolio analytics' : 'Your progress'}
        description={
          profile && profile.dominantTags.length > 0
            ? `Dominant themes: ${profile.dominantTags.slice(0, 3).join(', ').replace(/_/g, ' ')}`
            : 'See scores and tags across everything you have uploaded.'
        }
        cta="My Work"
        onClick={() => onNavigate('work')}
      />

      <HomeCard
        icon={Layers}
        title="Label photos"
        badge={pendingLabels > 0 ? pendingLabels : undefined}
        description={
          pendingLabels > 0
            ? 'I grouped similar shots — approve labels before they apply.'
            : 'Scan your library for consistent tags across shoots.'
        }
        cta={pendingLabels > 0 ? 'Review suggestions' : 'Scan library'}
        onClick={() => onNavigate('mentor')}
      />

      <HomeCard
        icon={MessageCircle}
        title={BRAND.mentorLabel}
        description="Ask how you are improving, what to practice next, or what stands out in your work."
        cta="Open chat"
        onClick={() => onNavigate('mentor')}
      />

      <div className="flex flex-wrap gap-3 text-sm pt-2">
        <button
          type="button"
          onClick={() => onNavigate('practice')}
          className="text-brand-400 hover:text-brand-300 font-medium"
        >
          Shoot Now →
        </button>
      </div>
    </div>
  );
};

function HomeCard({
  icon: Icon,
  title,
  description,
  cta,
  badge,
  onClick,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  badge?: number;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-5 transition-all ${
        highlight
          ? 'border-brand-500/40 bg-brand-500/8 hover:bg-brand-500/12 shadow-md shadow-black/20'
          : 'border-warm bg-surface-1 hover:bg-surface-2 shadow-sm shadow-black/10'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-brand-400 shrink-0" />
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        {badge != null && badge > 0 && (
          <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-500 text-on-brand text-xs font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-muted leading-relaxed mb-3">{description}</p>
      <span className="text-sm font-semibold text-brand-400">{cta} →</span>
    </button>
  );
}
