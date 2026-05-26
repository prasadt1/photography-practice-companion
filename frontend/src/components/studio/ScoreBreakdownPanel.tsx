import React, { useState } from 'react';
import { ScoreExplainer, ScoreExplainerTrigger } from '../ScoreExplainer';

export interface ScoreBreakdownRow {
  subject: string;
  score: number;
  critique: string;
}

interface Props {
  rows: ScoreBreakdownRow[];
  hoveredDimension: string | null;
  selectedDimension: string | null;
  onHoverDimension: (subject: string | null) => void;
  onSelectDimension: (subject: string) => void;
  onWhyClick: (subject: string) => void;
}

/** Score bars + critique — kept adjacent to the photo preview in Studio Overview. */
export const ScoreBreakdownPanel: React.FC<Props> = ({
  rows,
  hoveredDimension,
  selectedDimension,
  onHoverDimension,
  onSelectDimension,
  onWhyClick,
}) => {
  const [showExplainer, setShowExplainer] = useState(false);
  const activeDimension = hoveredDimension ?? selectedDimension;

  return (
    <div className="rounded-2xl border border-warm bg-surface-1 p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
            Score breakdown
          </h3>
          <p className="text-xs text-muted mt-1">
            Hover or tap a dimension — the highlight appears on the photo above.
          </p>
        </div>
        <ScoreExplainerTrigger onClick={() => setShowExplainer(true)} />
      </div>

      <div className="space-y-2">
        {rows.map((item) => {
          const isActive =
            hoveredDimension === item.subject || selectedDimension === item.subject;
          const barColor =
            item.score >= 8
              ? 'bg-amber-500'
              : item.score >= 5
                ? 'bg-amber-500/70'
                : 'bg-rose-500';
          return (
            <button
              key={item.subject}
              type="button"
              onClick={() => onSelectDimension(item.subject)}
              onMouseEnter={() => onHoverDimension(item.subject)}
              onMouseLeave={() => onHoverDimension(null)}
              onFocus={() => onHoverDimension(item.subject)}
              onBlur={() => onHoverDimension(null)}
              className={`w-full flex items-center gap-3 text-left p-2 rounded-lg transition-all ${
                isActive ? 'bg-brand-500/10 ring-1 ring-brand-500/40' : 'hover:bg-surface-3/50'
              }`}
            >
              <span
                className={`w-20 sm:w-24 text-xs truncate shrink-0 ${
                  isActive ? 'text-brand-400 font-semibold' : 'text-muted'
                }`}
              >
                {item.subject}
              </span>
              <div className="flex-1 h-2.5 bg-surface-3 rounded-full overflow-hidden min-w-0">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${item.score * 10}%` }}
                />
              </div>
              <span className="w-8 text-sm font-bold text-stone-100 shrink-0 tabular-nums">
                {item.score.toFixed(1)}
              </span>
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onWhyClick(item.subject);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onWhyClick(item.subject);
                  }
                }}
                className="text-xs text-brand-400 hover:text-brand-300 shrink-0 cursor-pointer"
              >
                Why?
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-xl border border-warm/80 bg-canvas-elevated/40 p-3 min-h-[4.5rem]"
        aria-live="polite"
      >
        {activeDimension ? (
          <>
            <p className="text-[10px] font-bold uppercase text-brand-400 tracking-wide mb-1">
              {activeDimension}
            </p>
            <p className="text-sm text-stone-200 leading-relaxed">
              {rows.find((c) => c.subject === activeDimension)?.critique}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted leading-relaxed">
            Select a dimension to read the critique for that score.
          </p>
        )}
      </div>

      <ScoreExplainer isOpen={showExplainer} onClose={() => setShowExplainer(false)} />
    </div>
  );
};
