/**
 * IrisMark — UI-weight "Contained Badge" mark.
 * Dark surface tile + bold amber eye + aperture (4.5px strokes).
 * Reads cleanly at 32–48px sidebar size. B+ geometry, no ticks needed at this scale.
 * The favicon (public/favicon.svg) stays as-is for ≤24px / browser tab contexts.
 */
export function IrisMark({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <rect x="4" y="4" width="92" height="92" rx="22" fill="#2a2724" stroke="#44403c" strokeWidth={1.5} />
      <g stroke="#fbbf24" strokeWidth={4.5}>
        <path d="M20 50 C32 31,68 31,80 50 C68 69,32 69,20 50 Z" />
        <circle cx="50" cy="50" r="16" />
        <line x1="50"    y1="34"    x2="55.86" y2="47.31" />
        <line x1="63.86" y1="42"    x2="55.13" y2="53.97" />
        <line x1="63.86" y1="58"    x2="49.41" y2="57.03" />
        <line x1="50"    y1="66"    x2="44.14" y2="52.69" />
        <line x1="36.14" y1="58"    x2="44.87" y2="46.03" />
        <line x1="36.14" y1="42"    x2="50.59" y2="42.97" />
      </g>
    </svg>
  );
}
