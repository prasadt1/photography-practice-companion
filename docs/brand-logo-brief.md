# Iris brand logo brief

**Status:** Shipped in web app (May 2026)  
**Mark:** Eye + camera aperture + memory-ring ticks (top/bottom arcs)

## Symbolism

| Element | Meaning |
|---------|---------|
| Almond eye + aperture blades | Iris (eye) + photography (lens) |
| Top/bottom arcs with ticks | Portfolio frames over time / focus dial — “remembers your journey” |
| Dark pupil | Lens element; Glass Box “sees” the scene |

Mentorship, growth, and frame-by-frame coaching are **product copy**, not extra icon detail.

## Usage

| Context | Asset |
|---------|--------|
| Sidebar, onboarding | `IrisMark` → `iris-icon.png` (approved raster; SVG blades read as petals at small size) |
| Favicon | `frontend/public/favicon.svg` (simplified mechanical iris) |
| PWA / App Store | `iris-icon-192.png`, `iris-icon-512.png` |
| Vector experiments | `iris-mark.svg` (not used in UI — reference only) |

**Do not** bake taglines into PNG lockups (AI typos). Wordmark in UI only:

- Name: **Newsreader** (`font-serif`), “Iris”
- Tagline: `BRAND.taglineShort` — “The mentor who remembers”

## Colors (warm darkroom — match `frontend/src/index.css`)

| Token | Hex | Use |
|-------|-----|-----|
| Canvas | `#1a1816` | App background, eye fill |
| Gold light | `#fbbf24` | Blades, arcs |
| Gold mid | `#f59e0b` | — |
| Gold dark | `#d97706` / `#b45309` | Eye stroke |
| Photo black | `#0a0908` | Pupil |

## Do / don’t

- **Do** use `iris-icon.png` in UI (matches approved comp); favicon uses simplified line iris.
- **Don’t** use curved filled SVG blades at sidebar size — they read as flower petals.
- **Do** keep icon simple at 32px (ticks may soften — acceptable).
- **Don’t** use white/cream circles behind the mark on dark chrome.
- **Don’t** use hollow/outlined lockups or “AI PHOTOGRAPHY MENTOR” in raster assets.
- **Don’t** add robots, film strips, chat bubbles, purple gradients.

## Related

- [`frontend/src/components/BrandLogo.tsx`](../frontend/src/components/BrandLogo.tsx)
- [`frontend/src/components/IrisMark.tsx`](../frontend/src/components/IrisMark.tsx)
- [`ios-implementation-plan.md`](ios-implementation-plan.md) — App Store icon from `iris-icon-512.png`
