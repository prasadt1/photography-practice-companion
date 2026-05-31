# Phase 1: Homepage + Sidebar + Palette + Footer + Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the layered homepage (first-visit vs returning user), sidebar dashboard strip with portfolio glimpses, palette refinements, redesigned footer, and clean logo zone.

**Architecture:** State-based homepage rendering with `photoCount` determining which view to show. Backend provides true strongest photo via `sort_by=score&limit=1` and real total via `count_documents()`. Sidebar becomes a living dashboard with contextual blocks that change per tab.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4.3, FastAPI, MongoDB

**Spec Reference:** `docs/superpowers/specs/2026-05-31-iris-full-polish-design.md` (Phase 1)

---

## File Structure

| File | Responsibility |
|------|----------------|
| `app/memory/portfolio.py` | Backend: true strongest photo query, `count_documents()` for total, first upload date |
| `frontend/src/services/memoryClient.ts` | Add `fetchStrongestPhoto()` and `fetchPortfolioStats()` functions |
| `frontend/src/types/memory.ts` | Add `PortfolioStats` type |
| `frontend/src/components/HomeTab.tsx` | Layered homepage: first-visit pitch hero vs returning user personal hero |
| `frontend/src/components/AppSidebar.tsx` | Dashboard strip: portfolio glimpses, contextual block, mentor one-liner |
| `frontend/src/components/BrandLogo.tsx` | Simplify lockup: remove tagline from sidebar header |
| `frontend/src/App.tsx` | Footer redesign: 3-line structure, visible on mobile |
| `frontend/src/index.css` | Palette refinements: contrast improvements, amber surface reduction |

---

## Task 1: Backend — True Strongest Photo Query

**Files:**
- Modify: `app/memory/portfolio.py:101-170`

- [ ] **Step 1: Add `get_portfolio_stats` function**

```python
def get_portfolio_stats(*, user_id: str | None = None) -> dict[str, Any]:
    """Get portfolio statistics: total count, first upload date, strongest photo ID."""
    query: dict[str, Any] = {}
    demo_user = os.environ.get("DEMO_USER_ID")
    if user_id:
        query["user_id"] = to_mongo_user_id(user_id)
    elif demo_user:
        query["user_id"] = ObjectId(demo_user)

    coll = get_db().portfolio_entries

    # Total count (efficient)
    total = coll.count_documents(query) if query else coll.estimated_document_count()

    # First upload date
    first_entry = coll.find_one(query, sort=[("created_at", 1)], projection={"created_at": 1})
    first_upload = None
    if first_entry and "created_at" in first_entry:
        dt = first_entry["created_at"]
        if isinstance(dt, datetime):
            first_upload = dt.strftime("%b %Y")

    # Strongest photo (by overall average)
    pipeline = [
        {"$match": query} if query else {"$match": {}},
        {"$addFields": {
            "_avgScore": {
                "$avg": [
                    "$scores.composition",
                    "$scores.lighting",
                    "$scores.technique",
                    "$scores.creativity",
                    "$scores.subject_impact",
                ]
            }
        }},
        {"$sort": {"_avgScore": -1}},
        {"$limit": 1},
        {"$project": {"embedding": 0}},
    ]
    strongest_docs = list(coll.aggregate(pipeline))
    strongest = _serialize_entry(strongest_docs[0]) if strongest_docs else None

    return {
        "total": total,
        "firstUpload": first_upload,
        "strongest": strongest,
    }
```

- [ ] **Step 2: Update `list_portfolio_entries` to use `count_documents`**

In `list_portfolio_entries`, change the return statement:

```python
# Before
return {"entries": entries, "total": len(entries)}

# After
coll = get_db().portfolio_entries
total_count = coll.count_documents(query) if query else coll.estimated_document_count()
return {"entries": entries, "total": total_count}
```

- [ ] **Step 3: Verify changes don't break existing tests**

Run: `cd /Users/prasadt1/projects/photography-practice-companion && python -m pytest app/memory/ -v -k portfolio`
Expected: All existing tests pass

- [ ] **Step 4: Commit backend changes**

```bash
git add app/memory/portfolio.py
git commit -m "feat(backend): add get_portfolio_stats with count_documents and strongest photo

- Add get_portfolio_stats() for efficient total count, first upload date, strongest photo
- Update list_portfolio_entries to use count_documents instead of len(entries)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Backend — Expose Stats Endpoint

**Files:**
- Modify: `app/api/routes/portfolio.py` (or equivalent router file)

- [ ] **Step 1: Find the portfolio router file**

Run: `grep -r "portfolio" app/api/ --include="*.py" | head -20`

- [ ] **Step 2: Add `/portfolio/stats` endpoint**

```python
@router.get("/portfolio/stats")
async def portfolio_stats(request: Request):
    """Get portfolio statistics: total, first upload date, strongest photo."""
    user_id = get_user_id_from_request(request)
    from memory.portfolio import get_portfolio_stats
    return get_portfolio_stats(user_id=user_id)
```

- [ ] **Step 3: Test endpoint manually**

Run: `curl -X GET "http://localhost:8000/api/v1/portfolio/stats" -H "X-User-Id: demo"`
Expected: JSON with `total`, `firstUpload`, `strongest` fields

- [ ] **Step 4: Commit endpoint**

```bash
git add app/api/
git commit -m "feat(api): add /portfolio/stats endpoint

Returns total count, first upload date, and strongest photo in one call.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Frontend — Add Portfolio Stats Service

**Files:**
- Modify: `frontend/src/services/memoryClient.ts`
- Modify: `frontend/src/types/memory.ts`

- [ ] **Step 1: Add PortfolioStats type**

In `frontend/src/types/memory.ts`, add:

```typescript
export interface PortfolioStats {
  total: number;
  firstUpload: string | null;
  strongest: PortfolioListItem | null;
}
```

- [ ] **Step 2: Add fetchPortfolioStats function**

In `frontend/src/services/memoryClient.ts`, add:

```typescript
import type { PortfolioStats } from '../types/memory';

export function fetchPortfolioStats(): Promise<PortfolioStats> {
  return getJson('/api/v1/portfolio/stats');
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npm run type-check`
Expected: No errors

- [ ] **Step 4: Commit frontend service**

```bash
git add frontend/src/services/memoryClient.ts frontend/src/types/memory.ts
git commit -m "feat(frontend): add fetchPortfolioStats service

Fetches total count, first upload date, and strongest photo.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: HomeTab — First Visit State (Pitch Hero)

**Files:**
- Modify: `frontend/src/components/HomeTab.tsx`

- [ ] **Step 1: Add state for portfolio stats and example ref**

At the top of the component, add:

```typescript
const [stats, setStats] = useState<PortfolioStats | null>(null);
const [pitchDismissed, setPitchDismissed] = useState(
  () => localStorage.getItem('iris:pitchBandDismissed') === 'true'
);
const exampleGlassBoxRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Update load function to fetch stats**

Replace the load function to use `fetchPortfolioStats`:

```typescript
const load = useCallback(async () => {
  setLoading(true);
  try {
    const [portfolioStats, recentPhotos, aesthetic, trendData] = await Promise.all([
      fetchPortfolioStats(),
      fetchPortfolio({ limit: 10, sortBy: 'date', sortOrder: 'desc' }),
      fetchAestheticProfile().catch(() => null),
      fetchPortfolioTrends(6).catch(() => null),
    ]);

    setStats(portfolioStats);
    setBestPhoto(portfolioStats.strongest);
    setContactSheet(recentPhotos.entries);
    setPortfolioTotal(portfolioStats.total);
    setProfile(aesthetic);
    setTrends(trendData);
  } catch {
    /* shell remains */
  } finally {
    setLoading(false);
  }
}, []);
```

- [ ] **Step 3: Add scroll-to-demo function**

```typescript
const scrollToDemoCritique = useCallback(() => {
  exampleGlassBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  exampleGlassBoxRef.current?.focus();
}, []);
```

- [ ] **Step 4: Create FirstVisitHero component (inline or extract)**

Add this JSX for first-visit state (when `portfolioTotal === 0`):

```tsx
{/* First Visit Pitch Hero */}
{portfolioTotal === 0 && (
  <div className="bg-gradient-to-b from-surface-2 to-canvas rounded-2xl p-8 md:p-12 border border-warm">
    <h1 className="font-serif text-3xl md:text-4xl text-white mb-4 leading-tight">
      Your AI photography mentor —<br />
      that remembers every shot you upload.
    </h1>
    <p className="text-stone-400 text-base md:text-lg mb-8 max-w-xl">
      Glass Box critiques on five dimensions, a private library that grows with you,
      practice assignments, and mentor chat.
    </p>
    <div className="flex flex-wrap gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
      >
        <Upload className="w-5 h-5" />
        Upload your first photo
      </button>
      <button
        type="button"
        onClick={scrollToDemoCritique}
        className="flex items-center gap-2 px-6 py-3 rounded-lg border border-brand-500 text-brand-400 font-medium hover:bg-brand-500/10 transition-colors"
      >
        See demo critique
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 5: Add Example Glass Box section with ref**

```tsx
{/* Example Glass Box (first visit) */}
{portfolioTotal === 0 && (
  <div
    ref={exampleGlassBoxRef}
    tabIndex={-1}
    className="bg-surface-1 rounded-xl p-6 border border-warm focus:outline-none focus:ring-2 focus:ring-brand-400"
  >
    <p className="text-xs uppercase tracking-widest text-muted mb-4">Example Critique</p>
    <div className="flex flex-col md:flex-row gap-6">
      <img
        src={EXAMPLE_PHOTO.url}
        alt={EXAMPLE_PHOTO.sceneDescription}
        className="w-full md:w-64 h-48 object-cover rounded-lg"
      />
      <div className="flex-1">
        <p className="text-stone-300 text-sm leading-relaxed mb-4">
          "{EXAMPLE_PHOTO.glassBoxSummary}"
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded text-sm">
            Composition 8.2
          </span>
          <span className="px-3 py-1 bg-brand-500/10 text-brand-400 rounded text-sm">
            Lighting 7.8
          </span>
        </div>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 6: Verify first-visit state renders**

Run dev server: `cd frontend && npm run dev`
Clear localStorage and refresh: should see pitch hero
Expected: Pitch hero with CTAs, "See demo critique" scrolls to example

- [ ] **Step 7: Commit first-visit state**

```bash
git add frontend/src/components/HomeTab.tsx
git commit -m "feat(home): add first-visit pitch hero with demo critique scroll

- Pitch hero with headline, subhead, Upload + Demo CTAs
- Example Glass Box section with focus animation
- 'See demo critique' scrolls to example

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: HomeTab — Returning User State (Personal Hero)

**Files:**
- Modify: `frontend/src/components/HomeTab.tsx`

- [ ] **Step 1: Create full-bleed personal hero**

Replace the existing hero section for returning users:

```tsx
{/* Returning User Personal Hero (full-bleed) */}
{portfolioTotal > 0 && bestPhoto && (
  <div className="relative overflow-hidden -mx-3 md:-mx-6 md:mx-0 md:rounded-2xl">
    <div className="relative h-[min(70vh,720px)] min-h-[420px]">
      {/* Full-bleed photo */}
      <img
        src={bestPhoto.imageUrl}
        alt={bestPhoto.sceneDescription || 'Your strongest work'}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-surface-2 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-stone-600" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-canvas via-canvas/60 to-transparent pointer-events-none" />

      {/* Info card overlay */}
      <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-auto md:max-w-md">
        <div className="backdrop-blur-md bg-canvas/80 border border-warm/60 p-6 rounded-xl">
          <p className="text-xs uppercase tracking-widest text-muted mb-2">Best in your library</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500 shadow-lg">
              <span className="text-2xl font-bold text-on-brand tabular-nums font-serif">
                {animatedScore.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-on-brand/70">/ 10</span>
            </div>
          </div>
          <p className="text-sm text-stone-300 mb-2 line-clamp-2">
            {bestPhoto.sceneDescription || 'Your photograph'}
          </p>
          <p className="text-xs text-muted mb-4">
            {portfolioTotal} photo{portfolioTotal === 1 ? '' : 's'}
            {stats?.firstUpload && ` · Member since ${stats.firstUpload}`}
          </p>
          {bestPhoto.aestheticTags && bestPhoto.aestheticTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bestPhoto.aestheticTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-surface-2 text-stone-300 rounded-md text-xs"
                >
                  {tag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Add slim pitch band (dismissible)**

```tsx
{/* Slim Pitch Band (returning user, dismissible) */}
{portfolioTotal > 0 && !pitchDismissed && (
  <div className="flex items-center justify-between bg-surface-1 border border-warm rounded-lg px-4 py-3">
    <p className="text-stone-400 text-sm">
      Remembers every shot you upload.
    </p>
    <button
      type="button"
      onClick={() => {
        localStorage.setItem('iris:pitchBandDismissed', 'true');
        setPitchDismissed(true);
      }}
      className="text-muted hover:text-stone-300 p-1"
      aria-label="Dismiss"
    >
      ×
    </button>
  </div>
)}
```

- [ ] **Step 3: Verify returning user state renders**

Add some photos to the portfolio and refresh.
Expected: Full-bleed photo hero with overlay card, slim pitch band below

- [ ] **Step 4: Commit returning user state**

```bash
git add frontend/src/components/HomeTab.tsx
git commit -m "feat(home): add returning user full-bleed hero with stats

- Full-bleed strongest photo as hero background
- Overlay card with score, stats, 'Member since', tags
- Dismissible slim pitch band persisted to localStorage

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: HomeTab — Elevated Mentor Card

**Files:**
- Modify: `frontend/src/components/HomeTab.tsx`

- [ ] **Step 1: Move mentor insight section up**

Reposition the mentor section to appear after slim pitch band, before growth/contact sheet:

```tsx
{/* Elevated Mentor Card */}
{portfolioTotal >= 3 && profile && (
  <div className="bg-gradient-to-br from-surface-1 to-surface-2 rounded-xl p-6 border border-warm">
    <p className="text-xs uppercase tracking-widest text-muted mb-3">From your mentor</p>
    <p className="text-stone-300 text-base leading-relaxed font-serif mb-4">
      {profile.dominantTags.length > 0
        ? `I notice you're drawn to ${profile.dominantTags.slice(0, 2).join(' and ').replace(/_/g, ' ')} work.${
            trendDelta && trendDelta > 0
              ? ` Your ${trendLabel?.toLowerCase()} has improved +${trendDelta.toFixed(1)} recently.`
              : ''
          }`
        : "Keep uploading — I'll help you see patterns across your shoots."}
    </p>
    <button
      type="button"
      onClick={() => onNavigate('mentor')}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-on-brand font-semibold hover:bg-brand-400 transition-colors"
    >
      Ask me anything
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
)}
```

- [ ] **Step 2: Adjust threshold for demo users**

Add mode check (requires prop):

```tsx
// Show mentor card: >= 3 for regular, >= 1 for demo
const showMentorCard = profile && (
  mode === 'demo' ? portfolioTotal >= 1 : portfolioTotal >= 3
);

{showMentorCard && (
  // ... mentor card JSX
)}
```

- [ ] **Step 3: Verify mentor card positioning**

With 3+ photos, mentor card should appear after pitch band, before growth section.

- [ ] **Step 4: Commit mentor card changes**

```bash
git add frontend/src/components/HomeTab.tsx
git commit -m "feat(home): elevate mentor card above growth section

- Move mentor insight after personal hero/pitch band
- Threshold: >= 3 photos (>= 1 for demo)
- Gradient card with 'Ask me anything' CTA

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: HomeTab — Contact Sheet with Upload CTA

**Files:**
- Modify: `frontend/src/components/HomeTab.tsx`

- [ ] **Step 1: Add Upload CTA to contact sheet section**

In the contact sheet header, add an upload button:

```tsx
<div className="flex items-end justify-between gap-4 mb-6">
  <div>
    <h2 className="font-serif text-2xl md:text-3xl text-white">
      {portfolioTotal > 0 ? 'Contact sheet' : 'Example critiques'}
    </h2>
    <p className="text-muted text-sm mt-1">
      {portfolioTotal > 0 ? 'Recent frames from your library' : 'Upload yours to begin'}
    </p>
  </div>
  <div className="flex items-center gap-3">
    {portfolioTotal > 0 && (
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-on-brand text-sm font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        Upload
      </button>
    )}
    {portfolioTotal > 0 && (
      <button
        type="button"
        onClick={() => onNavigate('work')}
        className="text-sm text-brand-400 hover:text-brand-300 font-medium shrink-0"
      >
        Open library →
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 2: Verify upload button appears**

Expected: Upload button visible next to "Open library →" when user has photos

- [ ] **Step 3: Commit contact sheet CTA**

```bash
git add frontend/src/components/HomeTab.tsx
git commit -m "feat(home): add Upload CTA to contact sheet section

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Footer Redesign

**Files:**
- Modify: `frontend/src/App.tsx:293-299`

- [ ] **Step 1: Replace footer with 3-line structure**

```tsx
<footer className="border-t border-warm py-6 px-4 md:px-8 bg-canvas">
  <div className="max-w-4xl mx-auto text-center space-y-2">
    {/* Line 1: Brand/Vision */}
    <p className="text-sm text-stone-300">
      Iris — your AI photography mentor that remembers every shot you upload.
    </p>
    {/* Line 2: Trust + Utility */}
    <p className="text-xs text-stone-400">
      Your photos stay in your private library. You approve every tag and listing.
      <span className="mx-2 text-warm">·</span>
      <ScoreExplainerTrigger onClick={() => setShowScoreExplainer(true)} />
      <span className="mx-2 text-warm">·</span>
      <button
        type="button"
        onClick={() => {/* TODO: How it works modal */}}
        className="text-brand-400 hover:text-brand-300 hover:underline"
      >
        How it works
      </button>
    </p>
    {/* Line 3: Author */}
    <p className="text-xs text-stone-500">
      Built by a fellow photographer — for the work you do between workshops, critiques, and shoots.
    </p>
  </div>
</footer>
```

- [ ] **Step 2: Remove `hidden lg:block` to show on mobile**

The new footer has no `hidden lg:block` — it's visible on all viewports.

- [ ] **Step 3: Add mobile spacing above bottom nav**

Ensure footer has adequate margin-bottom on mobile to not overlap BottomNav:

```tsx
<footer className="border-t border-warm py-6 px-4 md:px-8 bg-canvas mb-16 lg:mb-0">
```

- [ ] **Step 4: Verify footer on desktop and mobile**

Desktop: 3 lines centered, readable contrast
Mobile: Same 3 lines, padding above bottom nav

- [ ] **Step 5: Commit footer redesign**

```bash
git add frontend/src/App.tsx
git commit -m "feat(app): redesign footer with 3-line structure

- Line 1: Brand/vision (14px, stone-300)
- Line 2: Trust + utility links (12px, stone-400)
- Line 3: Author (12px, stone-500)
- Visible on all viewports (mobile + desktop)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Sidebar — Portfolio Glimpses

**Files:**
- Modify: `frontend/src/components/AppSidebar.tsx`

- [ ] **Step 1: Add portfolio glimpses state and props**

```tsx
interface Props {
  activeTab: AppTab;
  mode: UserMode;
  onNavigate: (tab: AppTab) => void;
  // New props for dashboard strip
  photoCount: number;
  recentPhotos: Array<{ id: string; imageUrl: string }>;
  trendDelta: number | null;
  activeAssignment: Assignment | null;
  pendingOrganize: number;
}
```

- [ ] **Step 2: Add portfolio glimpses section**

After the nav, before settings:

```tsx
{/* Portfolio Glimpses */}
<div className="px-3 py-4 border-t border-warm">
  {photoCount > 0 ? (
    <>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {recentPhotos.slice(0, 4).map((photo) => (
          <div
            key={photo.id}
            className="aspect-square rounded-md bg-surface-2 overflow-hidden"
          >
            <img
              src={photo.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400 mb-2">
        {photoCount} photo{photoCount === 1 ? '' : 's'}
      </p>
      {/* Mini sparkline */}
      {trendDelta !== null && (
        <div className="flex items-center gap-2">
          <div className="flex items-end gap-0.5 h-4">
            {[4, 5, 6, 5, 7, 8].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-sm ${i === 5 ? 'bg-brand-500' : 'bg-surface-3'}`}
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>
          <span className={`text-xs ${trendDelta > 0 ? 'text-green-400' : 'text-stone-400'}`}>
            {trendDelta > 0 ? '+' : ''}{trendDelta.toFixed(1)}
          </span>
        </div>
      )}
    </>
  ) : (
    <div className="flex flex-col items-center justify-center py-4 border border-dashed border-warm rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-stone-500 mb-2">
        +
      </div>
      <p className="text-xs text-stone-500 text-center">Upload your first photo</p>
    </div>
  )}
</div>
```

- [ ] **Step 3: Add contextual block**

```tsx
{/* Contextual Block */}
<div className="px-3 pb-4">
  {activeTab === 'practice' && activeAssignment && (
    <div className="bg-surface-2 rounded-lg p-3 border-l-2 border-brand-500">
      <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Active Assignment</p>
      <p className="text-xs text-stone-300 line-clamp-2">{activeAssignment.brief}</p>
    </div>
  )}
  {activeTab === 'mentor' && pendingOrganize > 0 && (
    <div className="bg-surface-2 rounded-lg p-3">
      <p className="text-xs text-stone-300">Organize · {pendingOrganize} pending</p>
    </div>
  )}
</div>
```

- [ ] **Step 4: Add mentor one-liner above settings**

```tsx
{/* Mentor One-Liner */}
{photoCount >= 3 && (
  <div className="px-3 py-3 border-t border-warm">
    <p className="text-xs text-brand-400">
      Your landscapes are improving — Composition +0.7 this month
    </p>
  </div>
)}
```

- [ ] **Step 5: Update App.tsx to pass new props to AppSidebar**

- [ ] **Step 6: Verify sidebar dashboard strip**

With photos: 2×2 grid, count, sparkline, contextual block
Without photos: "Upload your first photo" prompt

- [ ] **Step 7: Commit sidebar dashboard**

```bash
git add frontend/src/components/AppSidebar.tsx frontend/src/App.tsx
git commit -m "feat(sidebar): add portfolio glimpses and contextual blocks

- 2×2 thumbnail grid with photo count
- Mini sparkline with trend delta
- Tab-aware contextual block (assignment, organize count)
- Mentor one-liner above settings
- Empty state with upload prompt

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: BrandLogo — Simplify Lockup

**Files:**
- Modify: `frontend/src/components/BrandLogo.tsx`

- [ ] **Step 1: Remove tagline from sidebar variant**

Update the `icon` variant (used in sidebar) to not show tagline:

```tsx
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
```

- [ ] **Step 2: Keep tagline in lockup variant for onboarding**

The `lockup` variant (used in onboarding) should still show tagline.

- [ ] **Step 3: Commit logo simplification**

```bash
git add frontend/src/components/BrandLogo.tsx
git commit -m "feat(logo): remove tagline from sidebar icon variant

Tagline now only appears in lockup variant (onboarding) and footer.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Palette Refinements

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Add contrast-improved color utilities**

No changes to theme tokens needed — they're already correct. The improvements are in usage.

- [ ] **Step 2: Add sidebar logo zone styles**

```css
/* Sidebar logo zone — clean, no blur/grain */
.sidebar-logo-zone {
  background: var(--color-canvas);
  /* No backdrop-blur */
}
```

- [ ] **Step 3: Verify film grain doesn't cover sidebar**

In App.tsx, ensure FilmGrain component is only over main content, not sidebar.

- [ ] **Step 4: Commit palette refinements**

```bash
git add frontend/src/index.css
git commit -m "style: add sidebar logo zone utility class

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Capabilities Grid (First Visit)

**Files:**
- Modify: `frontend/src/components/HomeTab.tsx`

- [ ] **Step 1: Add capabilities grid for first visit**

```tsx
{/* Capabilities Grid (first visit) */}
{portfolioTotal === 0 && (
  <section>
    <h2 className="font-serif text-2xl text-white mb-6">What Iris can do</h2>
    <div className="grid sm:grid-cols-2 gap-4">
      {[
        { title: 'Glass Box Critique', desc: 'Five dimensions scored with visible reasoning' },
        { title: 'Practice Assignments', desc: 'Targeted challenges that build your weakest skills' },
        { title: 'Mentor Chat', desc: 'Portfolio-aware conversation with memory' },
        { title: 'Organize & Tag', desc: 'AI-suggested tags, duplicate detection, your approval' },
      ].map((cap) => (
        <div
          key={cap.title}
          className="bg-surface-1 rounded-xl p-5 border border-warm"
        >
          <h3 className="text-white text-sm font-medium mb-1">{cap.title}</h3>
          <p className="text-stone-400 text-xs">{cap.desc}</p>
        </div>
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 2: Verify grid renders on first visit**

Clear localStorage, refresh — capabilities grid should appear below example critique.

- [ ] **Step 3: Commit capabilities grid**

```bash
git add frontend/src/components/HomeTab.tsx
git commit -m "feat(home): add capabilities grid for first visit

2x2 grid: Glass Box, Practice, Mentor Chat, Organize & Tag

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Final Integration & Testing

- [ ] **Step 1: Run full test suite**

```bash
cd frontend && npm run type-check && npm run lint
cd .. && python -m pytest app/ -v
```
Expected: All pass

- [ ] **Step 2: Manual testing checklist**

- [ ] First visit (0 photos): Pitch hero, demo critique scroll, capabilities grid
- [ ] Returning user (1-2 photos): Full-bleed hero, pitch band, no mentor card
- [ ] Returning user (3+ photos): Full-bleed hero, pitch band, mentor card, growth section
- [ ] Sidebar empty state: "Upload your first photo"
- [ ] Sidebar with photos: 2×2 grid, count, sparkline, contextual block
- [ ] Footer on desktop: 3 lines, readable
- [ ] Footer on mobile: 3 lines, above bottom nav
- [ ] Dismiss pitch band: persists on refresh

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 homepage + sidebar + footer polish

- Layered homepage: first-visit pitch vs returning personal hero
- Full-bleed strongest photo hero with stats overlay
- Elevated mentor card (>= 3 photos)
- Sidebar dashboard: portfolio glimpses, contextual blocks
- 3-line footer visible on all viewports
- Simplified logo lockup (no tagline in sidebar)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

| Task | Component | Status |
|------|-----------|--------|
| 1 | Backend: portfolio stats | ⬜ |
| 2 | Backend: stats endpoint | ⬜ |
| 3 | Frontend: stats service | ⬜ |
| 4 | HomeTab: first visit | ⬜ |
| 5 | HomeTab: returning user | ⬜ |
| 6 | HomeTab: mentor card | ⬜ |
| 7 | HomeTab: contact sheet CTA | ⬜ |
| 8 | Footer redesign | ⬜ |
| 9 | Sidebar: portfolio glimpses | ⬜ |
| 10 | BrandLogo: simplify | ⬜ |
| 11 | Palette refinements | ⬜ |
| 12 | Capabilities grid | ⬜ |
| 13 | Integration & testing | ⬜ |
