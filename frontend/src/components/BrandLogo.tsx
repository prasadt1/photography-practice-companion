import { IrisMark } from './IrisMark';
import { useThemeMode } from '../lib/ThemeContext';

export function BrandLogo({
  size = 28,
  animate = false,
  className = '',
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const theme = useThemeMode();
  const isLight = theme === 'light';
  const markColor = isLight ? '#b45309' : '#f5a623';
  const markRim = isLight ? '#b45309' : '#fbbf24';
  const markSize = Math.round(size * 0.64);
  // Warm paper tone on dark canvas — pure white fights the amber mark
  const textColor = isLight ? '#292524' : '#e8e0d6';
  const markBottom = size * 0.84;

  return (
    <span
      className={`inline-flex items-end leading-none ${className}`}
      style={{
        fontFamily: "'Newsreader', Georgia, serif",
        fontWeight: 500,
        fontSize: size,
        color: textColor,
      }}
    >
      <span className="relative inline-block leading-none" style={{ width: `${size * 0.29}px` }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: `${markBottom}px`,
          }}
        >
          <IrisMark
            size={markSize}
            simple={size < 40}
            animate={animate}
            color={markColor}
            pupilRim={markRim}
          />
        </span>
        <span aria-hidden>&#x131;</span>
      </span>
      <span style={{ letterSpacing: '-0.01em' }}>ris</span>
      <span className="sr-only">iris</span>
    </span>
  );
}
