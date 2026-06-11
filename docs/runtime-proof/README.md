# Runtime proof — ADK Playground capture (Tier 2)

Optional evidence that the **same orchestrator** wired in production (`app/agent.py`) is visible in the **ADK dev playground** (localhost). This is not the live product URL — label it honestly as dev UI.

**Code-level proof (already committed):** `scripts/dump-agent-graph.py` → `docs/compliance-proof/evidence/agent-graph.json` → `proof-05-agent-graph.png`

**Runtime proof (this folder):** screen captures from `make playground` showing the roster and delegation in action.

## Prereqs

- `gcp-service-account.json` at repo root
- `.env` with `MONGODB_URI`, `DEMO_USER_ID`, Gemini / Vertex vars
- Clean desktop, **1920×1080** recording window, no stray tabs

## Start

```bash
cd /path/to/iris-photography-mentor
make playground
```

Browser: **http://127.0.0.1:8080** (ADK playground — not Coach API on 8081).

---

## Shot 1 — The roster (required)

**Goal:** Visual proof of **nine agents** — Orchestrator + 8 sub-agents.

1. Open the agent tree / selector in the playground UI.
2. Frame so every name is legible:
   - `orchestrator`
   - `coach`, `mentor`, `planner`, `reflection`, `field_coach`, `triage`, `print_sales`, `visual_describer`
3. Capture full window (PNG).

**Save as:** `docs/runtime-proof/playground-01-agent-roster.png`

**Caption (gallery / README):** *Same ADK orchestrator that runs on Cloud Run — agent roster in the ADK dev UI (localhost:8080). Nine LlmAgents: one orchestrator + eight sub-agents.*

**Where it goes:** **One** gallery slot + link from `docs/compliance-proof/README.md`. Do not add multiple playground images to the Devpost gallery.

---

## Shot 2 — Delegation in action (required)

**Goal:** Prove agents **run**, not just exist — orchestrator hands off to a sub-agent and tools fire.

1. Select the **orchestrator** (root agent).
2. Send a pre-typed prompt that routes clearly, e.g.:
   - *"What should I practice next based on my portfolio?"* → Planner / Mentor path
   - or *"Name my two strongest portfolio photos by score only — one sentence."* → Mentor + MCP reads
3. Expand the **events / function-call / tool panel** in the playground.
4. Capture the frame showing:
   - User message
   - Orchestrator delegation (AgentTool → sub-agent name)
   - At least one tool call (e.g. portfolio read, assignment, grounding)

**Save as:** `docs/runtime-proof/playground-02-delegation-events.png`

**Caption:** *Orchestrator delegates via AgentTool; sub-agent tool calls visible in the ADK event stream (dev UI).*

**Where it goes:** This folder (`docs/runtime-proof/`). Optionally a **2–3s cut** in the demo video architecture beat.

---

## Shot 3 — Persona gating (optional)

**Goal:** Echo the persona matrix from `proof-05-agent-graph.png`.

1. If the playground exposes persona / tool-list switching, set **hobbyist**.
2. Show that `print_sales` and `visual_describer` are **not** in the orchestrator tool list.
3. Switch to **working_pro** and show `print_sales` appears; **vision_impairment** and show `visual_describer` appears.

**Save as:** `docs/runtime-proof/playground-03-persona-gating.png`

Skip if the UI makes this fiddly — `proof-05` already documents gating in code.

---

## Honesty guardrails

| Say | Do not say |
|-----|------------|
| ADK dev playground (localhost) | Production judge URL |
| Same orchestrator entrypoint as Cloud Run / Agent Engine | Agent Engine is what judges hit today |
| MongoDB MCP on **read** paths in production | MCP on every write |

**Voiceover one-liner:** *"Production runs on Cloud Run; this is the same ADK orchestrator and tool graph in the dev playground."*

---

## After capture

```bash
# Commit captures (when ready)
git add docs/runtime-proof/playground-*.png
git commit -m "Add ADK playground runtime proof captures."
git push origin main
```

Regenerate compliance panels if you refreshed other evidence:

```bash
./scripts/verify-hackathon-stack.sh
cd app && uv run python ../scripts/dump-agent-graph.py
python3 scripts/build-compliance-proof-images.py
```

## Proof stack (complete when Shots 1–2 are in)

| Layer | Artifact |
|-------|----------|
| Code | `agent-graph.json`, `proof-05-agent-graph.png` |
| Runtime API | Cloud Trace + `mcp_read_ok` / `grounding_ok` logs, `verify-hackathon-stack.sh` |
| Orchestration UI | `playground-01-agent-roster.png`, `playground-02-delegation-events.png` |
