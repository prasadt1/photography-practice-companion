import type { PortfolioListItem } from '../types/memory';

/**
 * Pick a home hero frame that reads well full-bleed (Devpost / gallery screenshots).
 * Still drawn from the user's library — prefers golden-hour / sunset landscapes over
 * subjects that crop poorly (e.g. tall glacier faces, vertical compositions).
 */
export function pickHomeHeroPhoto(
  strongest: PortfolioListItem | null,
  candidates: PortfolioListItem[],
): PortfolioListItem | null {
  const pool = candidates.filter((e) => e.imageUrl && e.overallAverage > 0);
  if (pool.length === 0) return strongest;

  const rank = (p: PortfolioListItem): number => {
    let s = p.overallAverage * 10;
    const tags = p.aestheticTags.map((t) => t.toLowerCase());
    const desc = (p.sceneDescription ?? '').toLowerCase();

    if (tags.some((t) => ['golden_hour', 'sunset', 'tropical_sunset', 'backlit'].includes(t))) {
      s += 8;
    }
    if (tags.includes('landscape') && !desc.includes('vertical')) s += 3;
    if (desc.includes('wide-angle') || desc.includes('wide angle')) s += 2;
    if (desc.includes('glacier')) s -= 12;
    if (/\bvertical\b/.test(desc) && /\b(photograph|landscape|portrait)\b/.test(desc)) s -= 6;

    return s;
  };

  const best = [...pool].sort((a, b) => rank(b) - rank(a))[0];
  return best ?? strongest;
}
