import React from 'react';

interface Option {
  id: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

/** Pill-in-a-well toggle for 2–3 short options. (ModeToggle stays the persona switch.) */
export const SegmentedControl: React.FC<Props> = ({ options, value, onChange, ariaLabel, className = '' }) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className={`inline-flex p-1 gap-1 bg-surface-2 border border-warm rounded-md ${className}`}
  >
    {options.map((opt) => {
      const selected = opt.id === value;
      return (
        <button
          key={opt.id}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(opt.id)}
          className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${
            selected ? 'bg-brand-500 text-on-brand' : 'text-muted hover:text-white'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
