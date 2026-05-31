import React from 'react';
import { BRAND } from '../config/brand';
import { IrisMark } from './IrisMark';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  /** Icon + wordmark side by side (onboarding, sidebar). */
  variant?: 'icon' | 'lockup';
  className?: string;
}

const ICON_SIZES = { sm: 36, md: 48, lg: 56 } as const;
const NAME_STYLES = {
  sm: 'text-base font-serif font-bold',
  md: 'text-lg font-serif font-bold',
  lg: 'text-2xl font-serif font-bold',
} as const;
const TAGLINE_STYLES = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
} as const;

export const BrandLogo: React.FC<Props> = ({
  size = 'md',
  showWordmark = true,
  variant = 'icon',
  className = '',
}) => {
  const px = ICON_SIZES[size];
  const lockupIcon = size === 'lg' ? 72 : size === 'md' ? 56 : 44;

  if (variant === 'lockup' && showWordmark) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <IrisMark size={lockupIcon} />
        <div className="min-w-0 text-left">
          <p className={`${NAME_STYLES[size]} text-stone-100 leading-tight tracking-tight`}>
            {BRAND.name}
          </p>
          <p className={`${TAGLINE_STYLES[size]} text-stone-400 leading-tight mt-0.5`}>
            {BRAND.taglineShort}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <IrisMark size={px} />
      {showWordmark && (
        <p className={`${NAME_STYLES[size]} text-stone-100 leading-tight tracking-tight`}>
          {BRAND.name}
        </p>
      )}
    </div>
  );
};
