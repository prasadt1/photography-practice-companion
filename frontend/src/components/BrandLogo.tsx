import React from 'react';
import { BRAND } from '../config/brand';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  /** Full horizontal lockup image (icon + wordmark baked in). Best for onboarding hero. */
  variant?: 'icon' | 'lockup';
  className?: string;
}

const ICON_SIZES = { sm: 32, md: 40, lg: 48 } as const;

export const BrandLogo: React.FC<Props> = ({
  size = 'md',
  showWordmark = true,
  variant = 'icon',
  className = '',
}) => {
  const px = ICON_SIZES[size];

  if (variant === 'lockup' && showWordmark) {
    return (
      <img
        src="/iris-lockup.png"
        alt={`${BRAND.name} — ${BRAND.tagline}`}
        className={`h-auto max-w-full object-contain ${className}`}
        style={{ maxHeight: size === 'lg' ? 72 : size === 'md' ? 56 : 44 }}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/iris-icon.png"
        alt=""
        width={px}
        height={px}
        className="shrink-0 rounded-xl object-contain bg-transparent"
        aria-hidden
      />
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
