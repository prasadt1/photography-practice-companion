import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  steps?: string[];
  action?: { label: string; onClick: () => void };
}

export const TabEmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  description,
  steps,
  action,
}) => (
  <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-warm bg-surface-1/60 max-w-lg mx-auto">
    <Icon className="w-11 h-11 text-brand-400/80 mx-auto mb-4" aria-hidden />
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-muted leading-relaxed">{description}</p>
    {steps && steps.length > 0 && (
      <ol className="mt-4 text-left text-sm text-muted space-y-2 list-decimal list-inside">
        {steps.map((s) => (
          <li key={s}>
            <span className="text-stone-300">{s}</span>
          </li>
        ))}
      </ol>
    )}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand text-sm font-semibold hover:bg-brand-400"
      >
        {action.label}
      </button>
    )}
  </div>
);
