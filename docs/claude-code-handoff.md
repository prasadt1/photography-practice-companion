# Claude Code handoff — doc review (May 24, 2026)

Read this after pulling latest `main`. **Canonical spec:** [`spec.md`](spec.md). **Index:** [`doc-map.md`](doc-map.md).

---

## What changed (summary for Claude Code)

| Area | Change |
|------|--------|
| Phase 0 status | **No longer “all complete”** — honest checklist in `implementation-plan.md` aligned with spec §0.8 |
| New docs | `doc-map.md`, `decisions.md`, `mongodb-setup.md`, `demo-script.md`, `devpost-draft.md`, `CONTEXT.md` |
| Image storage | **ADR-002:** GCS for bytes; MongoDB for metadata + embeddings only |
| Atlas region | **ADR-001:** Flex cluster locked to `europe-west3` (only available region); Vertex/GCS in `us-central1` |
| MCP vs PyMongo | **ADR-003:** Orchestrator **reads** via MCP; sub-agents **write** via PyMongo — fixed overstated “all traffic via MCP” copy |
| `shoot_id` | **ADR-004:** logical grouping only — no `shoots` collection |
| Flex tier | Documented as **confirmed** (not assumed) |
| Bootstrap | Added `scripts/bootstrap-mongodb.py` |
| README | Expanded setup pointers |
| Child doc headers | Point to spec + doc-map |
| Testing | Renamed seed script reference to `seed-demo-data.py`; ISAR naming clarified |

---

## Why these changes

1. **Truthful gates** — Claiming Phase 0 complete blocked honest next steps (no ADK scaffold, no `scripts/`, `test_vertex_ai.py` doesn’t verify Gemini 3 / embeddings).
2. **Image storage** — Schema had `image_url` while security text said “no image storage.” Decision: **GCS + URLs in MongoDB** (rules-compliant GCP storage).
3. **Region** — User confirmed Belgium-only Atlas; cross-region latency documented instead of ignored.
4. **Partner narrative accuracy** — Judges need MCP on orchestrator reads; PyMongo writes are intentional, not a failure mode (with documented fallback).
5. **Repeatability** — `mongodb-setup.md` + bootstrap script match Approach 3 (hybrid) from MCP wizard Q&A.
6. **Submission assets** — Demo script and Devpost draft separated from 150KB design docs to reduce drift.

---

## What the earlier Claude Code pass missed or got wrong

| Issue | Detail |
|-------|--------|
| Phase 0 ✅ overstated | No `app/`, no Agent Starter Pack, docs not on GitHub yet, incomplete verification |
| MCP-only narrative | Architecture/judge text implied all DB access via MCP; spec uses PyMongo for sub-agent writes |
| Cluster name typo | `practice-photography-co` vs actual `practice-photography-companion-mvp-cluster` |
| Image storage gap | No GCS bucket for portfolio; contradicted `image_url` fields |
| `shoots` collection implied | `shoot_id` without documenting logical-only grouping |
| Env var mismatch | `MONGODB_URI` vs `MDB_MCP_*` not mapped in one place |
| Test script mismatch | `seed-test-data.py` vs spec `seed-demo-data.py`; `test_isar.py` naming confusion |
| `test_vertex_ai.py` | Tests legacy Gemini models, not `gemini-3-pro` / `multimodalembedding@001` |
| HITL | Ideation had assignment accept/decline; spec v3 doesn’t — explicitly deferred in ADR-007 |
| README / Devpost | Minimal README; no standalone demo or Devpost draft |
| Duplication risk | Five large docs repeat schema — use `doc-map.md` + edit spec §7 first |

---

## What Claude Code should do next

1. **Phase 1** — `uvx agent-starter-pack create` per spec §1.1 (`adk_live`, `us-central1`, Agent Engine).
2. ~~Bootstrap + Atlas indexes~~ — **Done** (`bootstrap-mongodb.py`, `portfolio_embedding_vector`, `glass_box_search`).
3. **Create GCS bucket** `practice-companion-portfolio` + upload helper for Coach/seed.
4. **Fix verification** — Update or replace `test_vertex_ai.py` to check `GEMINI_MODEL` and embedding model from `.env`.
5. **Implement** per `implementation-plan.md` Phase 2+; don’t regenerate conflicting architecture — **update spec §7 if schema changes**.
6. **Commit** `docs/`, `principles/`, `scripts/`, `CONTEXT.md` (no secrets).

---

## Questions already answered (don’t re-ask in wizard)

- Existing Atlas cluster — **yes**
- MCP capabilities — **all (D)**
- Scope — **MCP + Atlas setup (A)**; bootstrap via hybrid **Approach 3**
- Credentials — **env vars (A)**
- DB layout — **single DB flat (A)**
- Atlas features — **Vector + Search (C)**
- Indexes — **performance-focused (A)**

---

## File quick reference

```
CONTEXT.md
docs/spec.md              ← master
docs/doc-map.md
docs/decisions.md
docs/mongodb-setup.md
docs/claude-code-handoff.md  ← this file
scripts/bootstrap-mongodb.py
```
