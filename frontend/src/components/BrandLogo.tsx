import React from 'react';
import { BRAND } from '../config/brand';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const SIZES = { sm: 32, md: 40, lg: 48 } as const;

/** Aperture-inspired mark (photography-native, not generic camera glyph). */
export const BrandLogo: React.FC<Props> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const px = SIZES[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative shrink-0 rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 p-2 shadow-lg shadow-brand-500/25 ring-1 ring-brand-400/30"
        style={{ width: px, height: px }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="w-full h-full text-on-brand" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
          <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path
            d="M12 3v4M12 17v4M3 12h4M17 12h4"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
      {showWordmark && (
        <div className="min-w-0">
          <p className="font-extrabold text-white text-sm leading-tight tracking-tight">
            {BRAND.name}
          </p>
          <p className="text-[10px] text-stone-400 leading-tight hidden sm:block">
            {BRAND.tagline}
          </p>
        </div>
      )}
    </div>
  );
};
