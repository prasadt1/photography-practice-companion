# Practice Companion — Master Spec & Build Prompt (v5)

**Public brand (Devpost / UI):** **Iris** — *AI photography mentor with persistent portfolio memory*. Do not rename the GitHub repo, Firebase project, Cloud Run services, or MongoDB database (`practice_companion`).

**Project:** Photography Practice Companion (internal codename; user-facing: Iris)
**Repository:** `photography-practice-companion`
**Hackathon:** Google Cloud Rapid Agent Hackathon — MongoDB partner track
**Deadline:** June 11, 2026, 2:00 PM PT
**Today:** May 24, 2026 (18 days remaining)
**Owner:** Prasad Tilloo
**Stack:** Gemini 3 Pro + ADK (proper multi-agent) + Vertex AI Agent Engine + Agent Builder Data Store + MongoDB Atlas + Firebase Hosting + native iOS via SwiftUI

---

## ⚠️ READ THIS FIRST — Why v5 exists

v3 (Cursor-led build) shipped a working hosted product but materially diverged from the spec: Coach/Planner/Reflection were implemented as Python services called via FunctionTool wrappers, not as proper ADK sub-agents. Production had 0 ADK agents in the request path. The multi-agent claim was wallpaper.

v4 added explicit anti-patterns and verification commands to prevent that recurrence. v5 closes the remaining ambiguities that adversarial review surfaced — places where Cursor could still "resolve" interpretation in its own (wrong) direction even while passing the verification commands.

**Key v5 decisions, committed and non-negotiable (with one explicit fallback exception in §8.0):**

1. **Default target = 9 total LlmAgent instances:** 1 orchestrator + 8 sub-agents. Canonical and referenced everywhere. **Only** the formal, human-activated fallback in §8.0 may switch the build profile to 8 agents.
2. **Field Coach Orchestrator** is the 9th LlmAgent — not a "flow," not a "feature exercised by orchestrator routing." A proper sub-agent that delegates to other sub-agents within the iPhone field-capture path.
3. **iOS = SwiftUI native** (requires Mac + Xcode + Apple Developer account). Fallback only if no Mac: Capacitor wrap of existing PWA.
4. **Persona enforcement at tool level** — orchestrator's `AgentTool` list dynamically constructed per persona. Working-pro-only agents (Print Sales) aren't even available in the toolset for hobbyist sessions.
5. **Full file migration from v3 → v5** is specified in §1.5. Old Python services deleted before Phase 1 begins.
6. **HITL has structural implementation requirements** (data model, UI flow, audit log) — not just conceptual gates.

If you (Cursor / Claude Code / any AI tool) are reading this and your implementation diverges from any of these six commitments, **STOP** and surface the divergence before continuing.

---

## 1. How to use this document

### 1.1 Roles

- **Prasad (human)** — manual steps, decisions, signing in to dashboards. Marked **[MANUAL]**.
- **AI coding tool (Cursor or Claude Code)** — file creation, code generation, CLI commands. Marked **[AUTO]**.

### 1.2 Required opening prompt for every AI session

Every session must start with this verbatim:

```
Read /docs/spec.md in full before doing anything else. Pay particular attention to:
- §2 (Guardrails and Anti-Patterns)
- §1.5 (v3 → v5 file migration list)
- §3.5 (Canonical agent count: exactly 9)

If your proposed implementation diverges from any of the above, STOP and surface
the divergence — do NOT implement the divergent version.
```

### 1.3 Daily check-in prompt

At the end of each work session, ask the AI tool:

> *"Show me the multi-agent architecture as it stands today. List each ADK LlmAgent instance, its file path, its tools, and one example user query that would route to it. Confirm the active profile's expected agent count (9 by default; 8 only if §8.0 was explicitly activated by Prasad). If any sub-agent is implemented as a FunctionTool wrapper around a Python service rather than a proper LlmAgent, flag it explicitly."*

If the answer is anything other than 9 distinct LlmAgent instances each with its own file and tools, the architecture has drifted and needs correction.

### 1.4 Self-correction trigger

If the AI tool realizes mid-implementation that its approach matches an anti-pattern from §2.2, it MUST:

1. STOP. Do not commit further code.
2. Surface the divergence to Prasad in plain language: *"I implemented X as a Python service called via FunctionTool. §2 requires it to be a proper ADK sub-agent. Want me to refactor?"*
3. Wait for Prasad's instruction. Do not silently continue.

The v3 failure was that Cursor never surfaced the structural divergence. Do not repeat that.

### 1.5 v3 → v5 file migration

**The v3 hosted product is live and working but its agent architecture is wrong.** v5 requires explicit migration before Phase 1 begins.

**[AUTO] Files to DELETE from the existing v3 repo before Phase 1:**

```
app/coach/service.py                  # Python service Cursor built; replaced by proper sub-agent
app/coach/agent.py                    # unused stub from v3
app/planner/service.py                # Python service; replaced by proper sub-agent
app/reflection/service.py             # Python service; replaced by proper sub-agent
app/orchestrator/coach_tool.py        # FunctionTool wrapper around Coach service; obsolete
app/orchestrator/planner_tool.py      # FunctionTool wrapper around Planner service; obsolete
app/orchestrator/reflection_tool.py   # FunctionTool wrapper around Reflection service; obsolete
scripts/bootstrap-mongodb.js          # if it exists from v3 work; replaced by app/memory/indexes.py
```

**Wildcard deletes are explicitly prohibited.** Do NOT run `rm app/orchestrator/*_tool.py` or similar patterns. Delete each file by exact name. If other files exist in `app/orchestrator/` that are not in the list above (e.g., utility modules, configuration files, or shared helpers), they are NOT deleted. The AI coding tool must inspect each file in `app/orchestrator/` before deletion and confirm it is a FunctionTool wrapper to one of the listed v3 services. If uncertain, surface the file to Prasad rather than delete it.

**[AUTO] Files to CREATE in the new structure:**

```
app/agent.py                              # NEW orchestrator (proper LlmAgent with AgentTool)
app/sub_agents/coach.py                   # Coach as proper LlmAgent
app/sub_agents/mentor.py                  # Mentor sub-agent
app/sub_agents/planner.py                 # Planner sub-agent
app/sub_agents/reflection.py              # Reflection sub-agent
app/sub_agents/triage.py                  # Backlog Triage sub-agent
app/sub_agents/print_sales.py             # Print Sales Strategist (working_pro persona)
app/sub_agents/visual_describer.py        # Visual Describer (vision_impairment persona)
app/sub_agents/field_coach.py             # Field Coach Orchestrator (iPhone flow)
app/prompts/orchestrator.txt              # ≥80 lines
app/prompts/coach.txt                     # ≥30 lines
app/prompts/mentor.txt                    # ≥30 lines
app/prompts/planner.txt                   # ≥30 lines
app/prompts/reflection.txt                # ≥30 lines
app/prompts/triage.txt                    # ≥30 lines
app/prompts/print_sales.txt               # ≥30 lines
app/prompts/visual_describer.txt          # ≥30 lines
app/prompts/field_coach.txt               # ≥30 lines
app/memory/indexes.py                     # MongoDB schema + index creation
app/memory/schema.py                      # MongoDB document models
ios/                                       # NEW SwiftUI app directory
```

**[AUTO] Infrastructure to KEEP:**

- GCP project (`practice-companion-hackathon`)
- Firebase Hosting (existing setup)
- MongoDB Atlas Flex cluster (`practice-photography-companion-mvp-cluster`)
- Agent Builder Data Store (`photography-principles`)
- GCS bucket for photo storage
- Deployment scripts (Cloud Run, Firebase)
- Frontend React tabs (Studio/Practice/Memory/Field) — kept but rewired to call orchestrator
- XMP sidecar export client-side code
- Change stream listener (if deployed)

**[AUTO] Verification after migration:**

```bash
# These should return 0 (old files deleted)
ls app/coach/service.py 2>/dev/null | wc -l                  # 0
ls app/planner/service.py 2>/dev/null | wc -l                # 0
ls app/reflection/service.py 2>/dev/null | wc -l             # 0

# These should return 1 (new files created)
ls app/agent.py 2>/dev/null | wc -l                          # 1
ls app/sub_agents/*.py 2>/dev/null | wc -l                   # 8
ls app/prompts/*.txt 2>/dev/null | wc -l                     # 9
```

If verification fails, migration is incomplete. Do not proceed to Phase 1.

---

## 2. Guardrails and anti-patterns

This section exists because the v3 build used the anti-patterns below. **Cursor / Claude Code reading this: these are not suggestions. They are hard requirements.**

### 2.1 The fundamental rule

**Every sub-agent MUST be an actual `LlmAgent` instance with its own `instruction` and `tools=[...]`, NOT a Python service called from a FunctionTool wrapper.**

### 2.2 Anti-patterns — DO NOT do these

**❌ Anti-pattern 1: Wrapping a Python service as a FunctionTool and calling it a "sub-agent"**

```python
# WRONG — this is NOT a sub-agent
from google.adk.tools import FunctionTool

def analyze_photo(image_url: str) -> dict:
    return coach_service.analyze(image_url)  # calls Python service

orchestrator = LlmAgent(
    name="orchestrator",
    tools=[FunctionTool(analyze_photo)],   # this is a tool, not a sub-agent
)
```

This was the v3 implementation. It produces a system where the orchestrator is the only LLM-reasoning agent and "Coach" is just a deterministic Python function. No second agent exists. The multi-agent claim collapses.

**❌ Anti-pattern 2: Single agent with many tools, all routing through Python services**

```python
# WRONG — looks like multi-agent, isn't
orchestrator = LlmAgent(
    name="orchestrator",
    tools=[
        FunctionTool(call_coach_service),
        FunctionTool(call_planner_service),
        FunctionTool(call_reflection_service),
        # ...
    ],
)
```

Eight FunctionTools does not make multi-agent. This is one agent with tool-calling.

**❌ Anti-pattern 3: Different sub-agents with identical tool surfaces**

```python
# WRONG — sub-agents that aren't structurally different
coach_agent = LlmAgent(instruction="You are a Coach", tools=[same_tools])
planner_agent = LlmAgent(instruction="You are a Planner", tools=[same_tools])
reflection_agent = LlmAgent(instruction="You are Reflection", tools=[same_tools])
```

Different prompts on the same toolkit is role-play, not multi-agent. Each sub-agent must have ≥1 tool no other sub-agent has.

### 2.3 Required pattern — DO this

```python
# CORRECT — each sub-agent is its own ADK LlmAgent with unique tools
from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

coach_agent = LlmAgent(
    name="coach",
    model="gemini-3-pro",
    instruction=open("app/prompts/coach.txt").read(),
    tools=[
        analyze_image_multimodal_tool,      # unique to Coach
        ground_in_data_store_principles,     # shared with Mentor
        write_portfolio_entry_tool,          # unique to Coach
        generate_multimodal_embedding_tool,  # unique to Coach
    ],
)

planner_agent = LlmAgent(
    name="planner",
    model="gemini-3-pro",
    instruction=open("app/prompts/planner.txt").read(),
    tools=[
        get_portfolio_aggregates_by_skill_tool,  # unique to Planner
        get_active_assignment_tool,               # shared with Reflection
        write_practice_assignment_tool,           # unique to Planner
        query_data_store_principles_for_assignment_tool,  # unique to Planner (different from Coach's grounding)
    ],
)

# ... same pattern for all 8 sub-agents

# Orchestrator delegates via AgentTool, NOT FunctionTool
orchestrator = LlmAgent(
    name="orchestrator",
    model="gemini-3-pro",
    instruction=open("app/prompts/orchestrator.txt").read(),
    tools=build_persona_filtered_tool_list(),  # see §4.3 for dynamic filtering
)

def build_persona_filtered_tool_list(persona: str) -> list:
    """Tool list is constructed per persona. Working pro gets Print Sales;
    vision impairment gets Visual Describer; hobbyist gets neither."""
    base_tools = [
        AgentTool(agent=coach_agent),
        AgentTool(agent=mentor_agent),
        AgentTool(agent=planner_agent),
        AgentTool(agent=reflection_agent),
        AgentTool(agent=field_coach_agent),
        get_user_persona_tool,
        get_session_context_tool,
        get_active_assignment_tool,
    ]
    if persona in ["hobbyist", "working_pro"]:
        base_tools.append(AgentTool(agent=triage_agent))
    if persona == "working_pro":
        base_tools.append(AgentTool(agent=print_sales_agent))
    if persona == "vision_impairment":
        base_tools.append(AgentTool(agent=visual_describer_agent))
    return base_tools
```

### 2.4 Verification commands (run at every phase gate)

```bash
# Verify exactly 9 LlmAgent instances exist (1 orchestrator + 8 sub-agents)
LLM_AGENT_COUNT=$(grep -rh "LlmAgent(" app/ | grep -v "^#" | wc -l)
echo "LlmAgent instances: $LLM_AGENT_COUNT (must be 9)"
test $LLM_AGENT_COUNT -eq 9 || echo "FAIL: expected 9, got $LLM_AGENT_COUNT"

# Verify 8 sub-agent files exist
SUB_AGENT_COUNT=$(ls app/sub_agents/*.py 2>/dev/null | wc -l)
echo "Sub-agent files: $SUB_AGENT_COUNT (must be 8)"
test $SUB_AGENT_COUNT -eq 8 || echo "FAIL: expected 8, got $SUB_AGENT_COUNT"

# Verify 9 prompt files exist (1 orchestrator + 8 sub-agents)
PROMPT_COUNT=$(ls app/prompts/*.txt 2>/dev/null | wc -l)
echo "Prompt files: $PROMPT_COUNT (must be 9)"
test $PROMPT_COUNT -eq 9 || echo "FAIL: expected 9, got $PROMPT_COUNT"

# Verify each prompt is substantial (≥30 lines)
for f in app/prompts/*.txt; do
    LINES=$(wc -l < "$f")
    test $LINES -ge 30 || echo "FAIL: $f has $LINES lines (need ≥30)"
done

# Verify orchestrator uses AgentTool, not FunctionTool, for sub-agents
AGENT_TOOL_COUNT=$(grep "AgentTool(agent=" app/agent.py | wc -l)
echo "AgentTool registrations: $AGENT_TOOL_COUNT (must be ≥8)"
test $AGENT_TOOL_COUNT -ge 8 || echo "FAIL: expected ≥8, got $AGENT_TOOL_COUNT"

# Verify old v3 service files are deleted
for f in app/coach/service.py app/planner/service.py app/reflection/service.py; do
    test ! -f "$f" || echo "FAIL: v3 file still exists: $f"
done
```

If any of these checks fail, the phase is incomplete. **Do not proceed to the next phase.**

### 2.4.b Runtime introspection check (persona isolation)

The grep checks in §2.4 prove that 9 LlmAgent instances exist in the codebase. They do NOT prove that persona filtering correctly excludes forbidden agents at runtime. This runtime check does, and it MUST also pass at the Phase 1 gate.

Create `tests/test_persona_isolation.py`:

```python
"""
Runtime verification: orchestrator's persona-filtered toolset MUST match
the canonical persona matrix in §3.2. Forbidden agents must NOT be reachable.

Run after Phase 1: python -m pytest tests/test_persona_isolation.py -v
"""

from app.agent import build_persona_filtered_tool_list

def _agent_names(tools):
    return {t.agent.name for t in tools if hasattr(t, 'agent')}

def test_hobbyist_isolation():
    names = _agent_names(build_persona_filtered_tool_list("hobbyist"))
    # Required agents:
    for required in ["coach", "mentor", "planner", "reflection", "triage", "field_coach"]:
        assert required in names, f"FAIL: hobbyist missing required agent: {required}"
    # Forbidden agents:
    for forbidden in ["print_sales", "visual_describer"]:
        assert forbidden not in names, f"FAIL: hobbyist has forbidden agent: {forbidden}"

def test_working_pro_isolation():
    names = _agent_names(build_persona_filtered_tool_list("working_pro"))
    for required in ["coach", "mentor", "planner", "reflection", "triage", "field_coach", "print_sales"]:
        assert required in names, f"FAIL: working_pro missing required agent: {required}"
    for forbidden in ["visual_describer"]:
        assert forbidden not in names, f"FAIL: working_pro has forbidden agent: {forbidden}"

def test_vision_impairment_isolation():
    names = _agent_names(build_persona_filtered_tool_list("vision_impairment"))
    for required in ["coach", "mentor", "planner", "reflection", "field_coach", "visual_describer"]:
        assert required in names, f"FAIL: vision_impairment missing required agent: {required}"
    for forbidden in ["print_sales", "triage"]:
        assert forbidden not in names, f"FAIL: vision_impairment has forbidden agent: {forbidden}"

def test_all_personas_have_orchestrator_base():
    for persona in ["hobbyist", "working_pro", "vision_impairment"]:
        names = _agent_names(build_persona_filtered_tool_list(persona))
        for base in ["coach", "mentor", "planner", "reflection", "field_coach"]:
            assert base in names, f"FAIL: {persona} missing base agent: {base}"
```

This test asserts **both** required and forbidden agents per persona. If §2.4 grep checks pass but this test fails, persona enforcement is at the wrong level (probably prompt-only suggestion rather than tool-level enforcement) — the architecture has drifted and must be corrected before Phase 2.

In fallback mode (§8.0), update this test to remove `"triage"` from required agents in `test_hobbyist_isolation` and `test_working_pro_isolation`.

---

## 3. Product overview

### 3.1 One-paragraph description

Practice Companion is an AI photography mentor that adapts to who you are and remembers what you've made. It serves three genuinely different personas (hobbyist developing skills, working pro pursuing commercial outcomes, photographer with vision impairment pursuing creative expression) through persona-based agentic orchestration: the same iPhone app, web app, and memory layer produce structurally different products via different sub-agent compositions. The persistent thread: an AI mentor that remembers you, accessible from any channel, grounded in your evolving aesthetic identity.

### 3.2 Three personas with structurally different agentic behavior

| Persona | Priority | Sub-agents available in orchestrator's toolset | Output modality |
|---|---|---|---|
| **Hobbyist** | Skill development | Coach, Mentor, Planner, Reflection, Triage, Field Coach (6 sub-agents + orchestrator = 7 agents available in this session) | Visual UI + Glass Box critique + voice nudges |
| **Working Pro** | Commercial outcomes | Coach, Mentor, Planner, Reflection, Triage, Field Coach, **Print Sales Strategist** (7 sub-agents + orchestrator = 8 agents available in this session) | Visual UI + business reasoning chains + revenue-aware planning |
| **Photographer with Vision Impairment** | Capture assistance | Coach, Mentor, Planner, Reflection, Field Coach, **Visual Describer** (6 sub-agents + orchestrator = 7 agents available in this session). **Triage is NOT available** — Triage's bulk-visual-clustering UI is not voice-first and would degrade for this persona; deferred to post-hackathon work on accessibility-first Triage variant. | Voice-first + haptic feedback + scene narration |

**Note:** The CODEBASE contains all 9 LlmAgent instances (always). The orchestrator's RUNTIME toolset is filtered per persona by `build_persona_filtered_tool_list()` (see §4.3). This means:
- Code grep returns 9 LlmAgent instances ✓
- Hobbyist users cannot invoke Print Sales or Visual Describer ✓
- Working pros cannot invoke Visual Describer (and vice versa) ✓
- Persona enforcement is at the tool level (architectural), not the prompt level (suggestion)

### 3.3 Five agentic features

| Feature | Primary persona | Primary channel | LlmAgent(s) primarily exercised |
|---|---|---|---|
| **Mentor Copilot** | All three | Mobile + Web | Orchestrator → Mentor → (Coach, Reflection, Planner as needed) |
| **Live Field Coach** | All three (mode-dependent) | iPhone | Orchestrator → **Field Coach (9th LlmAgent)** → (Coach, Visual Describer, Mentor as needed) |
| **Backlog Triage Agent** | Hobbyist, Working Pro | Web | Orchestrator → Triage |
| **Print Sales Strategist** | Working Pro only | Mobile + Web | Orchestrator → Print Sales Strategist |
| **Visual Describer** | Photographer with Vision Impairment | iPhone primarily | Orchestrator → Visual Describer (sometimes via Field Coach in field mode) |

**Live Field Coach is implemented as a proper LlmAgent (Field Coach Orchestrator).** It receives camera frames and session state, then makes LLM-reasoned decisions about which other sub-agents to invoke (Coach for analysis, Visual Describer for description in vision_impairment mode, Mentor for assignment context). This makes the iPhone field-capture flow genuinely agentic — not a UI experience routing to other agents.

### 3.4 Three channels

| Channel | Identity | Unique capabilities | Hackathon scope |
|---|---|---|---|
| **iPhone (native SwiftUI app)** | "The viewfinder companion" | Live Field Coach with ARKit composition overlays, native camera control via AVFoundation, AVSpeechSynthesizer voice agent, UIImpactFeedbackGenerator haptic feedback for vision_impairment mode, push notifications | **Primary deliverable.** TestFlight or App Store submission. |
| **Web (existing React PWA)** | "The studio" | Mentor Chat, Studio/Practice/Memory tabs, single-photo critique, accessible from any device | **Secondary deliverable.** Stays on Firebase Hosting. |
| **Desktop (native macOS)** | "The darkroom" | Lightroom integration via file system watching, Backlog Triage at scale, bulk XMP operations | **Out of scope.** Post-hackathon. |

**iOS framework decision: SwiftUI native.** Reasons:
- Native ARKit for AR composition overlays (critical for sighted mode demo)
- Native AVSpeechSynthesizer for voice (critical for vision_impairment mode)
- Native UIImpactFeedbackGenerator for haptics (critical for vision_impairment mode)
- Native camera control via AVFoundation (better quality than browser getUserMedia)
- TestFlight + App Store submission path
- Apple Watch companion possible if time permits

**Prerequisite:** Prasad must confirm in Phase 0:
- [ ] Mac available with Xcode 15+ installed
- [ ] Apple Developer Program enrollment status (enroll today if not active)

**Fallback if no Mac:** Capacitor wraps existing React PWA into a native iOS shell. Loses native ARKit/voice/haptics but gets App Store submission. Effort: 6-10 hours vs 30-40 hours for SwiftUI. This is a strict downgrade in product quality and should only be the fallback.

### 3.5 Canonical agent count

**Target architecture: exactly 9 LlmAgent instances.** This is the canonical build target. A formal 8-agent fallback profile (§8.0) activates ONLY if Phase 1 verifiably fails by EOD May 30, and only by Prasad's human-initiated decision — never by the AI coding tool's discretion.

| # | Agent | File | Always available in orchestrator toolset? |
|---|---|---|---|
| 1 | Orchestrator | `app/agent.py` | N/A (this IS the orchestrator) |
| 2 | Coach | `app/sub_agents/coach.py` | Yes (all personas) |
| 3 | Mentor | `app/sub_agents/mentor.py` | Yes (all personas) |
| 4 | Planner | `app/sub_agents/planner.py` | Yes (all personas) |
| 5 | Reflection | `app/sub_agents/reflection.py` | Yes (all personas) |
| 6 | Triage | `app/sub_agents/triage.py` | Yes (hobbyist + working_pro, not vision_impairment) |
| 7 | Field Coach | `app/sub_agents/field_coach.py` | Yes (all personas) |
| 8 | Print Sales Strategist | `app/sub_agents/print_sales.py` | Only working_pro persona |
| 9 | Visual Describer | `app/sub_agents/visual_describer.py` | Only vision_impairment persona |

**Verification commands in §2.4 are anchored to the 9-agent target.** Any deviation (10 agents, 8 agents, etc.) is a failure of the phase gate UNLESS the formal 8-agent fallback (§8.0) has been human-activated. The number 9 is referenced throughout this spec — if you see a different number anywhere except §8.0, that's a documentation error, not a license to implement differently.

---

## 4. Architecture — multi-agent with persona-based routing

### 4.1 Component diagram (verbal)

- **iOS app (SwiftUI)** + **Web app (React on Firebase Hosting)** — both call the same agent endpoints
- **Agent endpoint** (Vertex AI Agent Engine or Cloud Run hosted ADK orchestrator) — receives user input, builds persona-filtered toolset, routes via orchestrator
- **Orchestrator** (LlmAgent #1) — looks up user persona, parses user intent, builds persona-filtered tool list, delegates to one or more sub-agents
- **8 sub-agents** (LlmAgents #2-9) — each is its own ADK Agent with distinct instruction and tools
- **MongoDB Atlas** — accessed by sub-agents through MongoDB MCP Server (primary) or direct PyMongo (write hot paths)
- **Vertex AI Gemini 3 Pro** — model backing every agent
- **Agent Builder Data Store** — photography principles grounding, queried by Coach and Mentor
- **GCS** — photo originals
- **Vertex AI multimodalembedding@001** — embeddings for portfolio vector search
- **Change stream listener (Cloud Run)** — derives `aesthetic_profile` reactively from `portfolio_entries` writes

### 4.2 Orchestrator routing logic

The orchestrator's system prompt (`app/prompts/orchestrator.txt`) makes routing decisions based on:

1. **User persona** (`hobbyist | working_pro | vision_impairment`) — fetched from MongoDB user document
2. **User intent** (parsed from natural language input) — examples below
3. **Current session context** (active assignment, recent uploads, conversation history)

Example routing decisions:

| User input | Persona | Sub-agent(s) invoked | Reasoning |
|---|---|---|---|
| "Critique this photo" + image | Hobbyist | Coach | Single-photo analysis with skill-development framing |
| "Critique this photo" + image | Working Pro | Coach + Print Sales Strategist (if photo scores high) | Adds commercial-fit analysis |
| "Tell me what I just captured" + image | Vision Impairment | Visual Describer | Voice-first scene description, not aesthetic critique |
| "What should I work on next?" | Hobbyist | Planner (with skill-development priority) | Personal growth focus |
| "What should I work on next?" | Working Pro | Planner (with business priority) + Print Sales Strategist | Revenue-aware planning |
| "How am I doing with portraits?" | Hobbyist | Mentor (which orchestrates: Atlas Search + portfolio aggregation + Reflection) | Multi-source synthesis of progress |
| "I just finished my assignment" | All | Reflection → Planner (sequential) | Compute delta, then propose next |
| "Organize my photos from 2024" | Hobbyist, Working Pro | Triage | Bulk archive operation |
| "Which photos should I list on Society6?" | Working Pro only | Print Sales Strategist | Marketplace recommendations |
| "Center the subject in the frame" (voice) | Vision Impairment | Visual Describer (with haptic engine) | Real-time spatial guidance |
| **iPhone camera frame** (any persona) | All | **Field Coach** → (Coach or Visual Describer based on persona, plus Mentor for assignment context) | Real-time field coaching with sub-delegation |

### 4.3 Persona enforcement at tool level

**Persona filtering happens in the orchestrator's TOOL CONSTRUCTION, not in its prompt.** The orchestrator cannot invoke a sub-agent it doesn't have a tool for.

```python
def build_persona_filtered_tool_list(persona: str) -> list:
    base_tools = [
        AgentTool(agent=coach_agent),
        AgentTool(agent=mentor_agent),
        AgentTool(agent=planner_agent),
        AgentTool(agent=reflection_agent),
        AgentTool(agent=field_coach_agent),
        get_user_persona_tool,
        get_session_context_tool,
        get_active_assignment_tool,
    ]
    if persona in ["hobbyist", "working_pro"]:
        base_tools.append(AgentTool(agent=triage_agent))
    if persona == "working_pro":
        base_tools.append(AgentTool(agent=print_sales_agent))
    if persona == "vision_impairment":
        base_tools.append(AgentTool(agent=visual_describer_agent))
    return base_tools
```

This is architectural enforcement, not prompt guidance. A judge reviewing the code sees explicit per-persona tool filtering.

### 4.4 Edge case: user asks for capability outside their persona

If a hobbyist asks "which photos should I list on Society6?", the orchestrator cannot invoke Print Sales Strategist (it's not in the toolset). The orchestrator's instruction (`app/prompts/orchestrator.txt`) must include this fallback:

> *"If the user requests a capability that is unavailable for their persona, respond with: 'That capability is available in [persona] mode. Would you like to switch your persona? (You can change this in Settings.)' Do NOT pretend the capability is unavailable for technical reasons. Do NOT silently refuse without explanation."*

### 4.5 Sequential and parallel orchestration

The multi-agent claim requires both patterns be demonstrable:

**Sequential example:** User says "I just finished my assignment, here are the new photos." Orchestrator:
1. Invokes Coach for each photo (analyzes, stores, embeds)
2. Invokes Reflection (compares baseline to completion shoots, computes skill_delta)
3. Invokes Planner (proposes next assignment based on demonstrated improvement)
Three sub-agent invocations in sequence, each feeding the next.

**Parallel example:** User asks "How am I doing on portraits?" Orchestrator invokes Mentor, which itself fans out:
1. Atlas Search over Glass Box content (text search) — concurrent
2. Vector search for visual similarity to portrait baseline — concurrent
3. Aesthetic profile aggregation — concurrent
4. Synthesis from all three results in a single response

Two patterns must be visible in traces for at least one demo query each.

### 4.6 Why this is genuine multi-agent (not theater)

- 9 distinct LlmAgent instances in the codebase, each with its own file, prompt (≥30 lines), and `tools=[...]` distinct from other agents
- Persona filtering changes which sub-agents are invocable (tool-level enforcement)
- Sequential orchestration (Reflection → Planner) and parallel orchestration (Mentor calling multiple sub-agents) both demonstrated
- Traces show multiple LLM spans, one per sub-agent invocation
- The grep `grep -r "LlmAgent(" app/ | wc -l` returns exactly 9

### 4.7 Routing contract per UI action (authoritative)

For every major UI action, this table specifies whether the request goes through the agentic orchestrator path or a deterministic service path. **This is the single source of truth for what's agentic vs deterministic.** No other section may contradict this table.

**Endpoint naming clarification:** `/v1/agent/*` paths in this spec are **product API contracts**, not a claim that Vertex AI Agent Engine natively exposes those exact URLs. In deployment, these contracts can be implemented either (a) directly in a Cloud Run gateway that proxies to Agent Engine sessions, or (b) as first-class Cloud Run ADK endpoints when using the fallback backend path. The UI contracts stay stable; backend wiring can vary per §9.

| UI action | Path | Endpoint | Expected sub-agent / tool usage |
|---|---|---|---|
| **Studio: upload photo** | Orchestrator | `POST /v1/agent/invoke` (intent=critique) | Orchestrator → Coach sub-agent → writes portfolio_entry |
| **Studio: view existing critique** | Deterministic | `GET /v1/portfolio/{id}` | Direct MongoDB read; no agent invocation |
| **Studio: edit/override Coach scores** | Deterministic | `PATCH /v1/portfolio/{id}/overrides` | Direct MongoDB write to `user_overrides` array |
| **Practice: view active assignment** | Deterministic | `GET /v1/practice/active` | Direct MongoDB read |
| **Practice: accept proposed assignment** | Deterministic | `PATCH /v1/practice/{id}` (status=active) | Direct MongoDB write |
| **Practice: decline proposed assignment** | Deterministic | `PATCH /v1/practice/{id}` (status=declined, reason=...) | Direct MongoDB write |
| **Practice: complete assignment + propose next** | Orchestrator | `POST /v1/agent/invoke` (intent=complete_and_replan) | Orchestrator → Reflection → Planner (sequential) |
| **Memory: view portfolio** | Deterministic | `GET /v1/portfolio?user_id=...` | Direct MongoDB read |
| **Memory: simple keyword search (filter UI)** | Deterministic | `GET /v1/portfolio/search?q=...&type=keyword` | Direct Atlas Search query |
| **Memory: semantic / natural-language query** | Orchestrator | `POST /v1/agent/invoke` (intent=query_memory) | Orchestrator → Mentor → (Atlas Search + Vector Search + Reflection) |
| **Mentor Chat: send message** | Orchestrator | `POST /v1/agent/invoke` (intent=chat) | Orchestrator → Mentor → (sub-agents as needed) |
| **iPhone Field Mode: start session** | Deterministic | `POST /v1/capture_sessions` | Direct MongoDB write |
| **iPhone Field Mode: stream camera frame** | Orchestrator | `POST /v1/agent/field_capture` | Orchestrator → Field Coach → (Coach for sighted OR Visual Describer for vision_impairment) + Mentor for assignment context |
| **iPhone Field Mode: voice command** | Orchestrator | `POST /v1/agent/field_voice` | Orchestrator → Field Coach → (Visual Describer for vision_impairment) |
| **iPhone Field Mode: capture frame to portfolio** | Deterministic + ML side-effect | `POST /v1/portfolio` | Direct MongoDB write + Vertex AI embedding call (deterministic ML call, not agent) |
| **iPhone Field Mode: end session + auditory summary** | Orchestrator | `POST /v1/agent/invoke` (intent=narrate_session) | Orchestrator → Visual Describer (vision_impairment only) |
| **Persona toggle** | Deterministic | `PATCH /v1/users/me` (persona=...) | Direct MongoDB write; orchestrator's toolset reflects on next agent invocation |
| **Working Pro: view print sales recommendations** | Orchestrator | `POST /v1/agent/invoke` (intent=print_recommendations) | Orchestrator → Print Sales Strategist |
| **Working Pro: approve listing** | Deterministic + side-effect | `PATCH /v1/pending_approvals/{id}` (action=approve) | Direct MongoDB write; side-effect: marketplace publication queued |
| **Working Pro: modify listing** | Deterministic + side-effect | `PATCH /v1/pending_approvals/{id}` (action=modify, override_payload=...) | Direct MongoDB write; side-effect: marketplace publication queued with override |
| **Working Pro: reject listing** | Deterministic | `PATCH /v1/pending_approvals/{id}` (action=reject) | Direct MongoDB write |
| **Triage: start backlog processing** | Orchestrator | `POST /v1/agent/invoke` (intent=triage_backlog) | Orchestrator → Triage |
| **Triage: approve proposed tag application** | Deterministic + side-effect | `PATCH /v1/pending_approvals/{id}` (action=approve) | Direct MongoDB write; side-effect: bulk tag commit + aesthetic_profile change-stream trigger |
| **Triage: approve proposed photo deletion** | Deterministic + side-effect | `PATCH /v1/pending_approvals/{id}` (action=approve) | Direct MongoDB write; side-effect: photo deletion |
| **Vision Impairment: cross-session recall query** | Orchestrator | `POST /v1/agent/invoke` (intent=recall_captures) | Orchestrator → Visual Describer → Atlas Search on `scene_search` index |

**Principle:** The orchestrator path is used whenever the response requires LLM reasoning, multi-source synthesis, or sub-agent delegation. The deterministic path is used for state transitions, lookups, and writes that don't require reasoning. Agentic claims are anchored in the orchestrator-routed actions. HITL approve/modify/reject endpoints are intentionally deterministic — the agency was in the proposal step (sub-agent created the `pending_approvals` document); the approval step is a simple state transition with side-effects.

---

## 5. Human-in-the-Loop architecture

HITL is structural for Practice Companion, not decorative. The hackathon criterion for "structural" HITL is that the gates must be required by the problem rather than bolted on to satisfy a rubric.

### 5.1 Three HITL patterns

**Pattern 1: Hard gates** — actions the agent CANNOT take autonomously, ever
- Deleting any photo (Triage)
- Publishing any marketplace listing (Print Sales Strategist)
- Sending any client-facing communication (future scope)

**Pattern 2: Soft gates** — actions the agent proposes, user approves or modifies before commit
- Practice assignment generation (Planner)
- Bulk tag suggestions (Triage)
- Coach analysis commit to portfolio
- Capture descriptions and scene narration (Visual Describer)
- Marketplace listing drafts (Print Sales)

**Pattern 3: Override-as-training-signal** — user corrections feed back into the system and improve future behavior
- Tag overrides update `aesthetic_profile` via change stream
- Score overrides on Coach analysis update grounding pattern weights
- Listing edits in Print Sales inform future draft templates per marketplace
- Scene description corrections (vision impairment) improve future Visual Describer outputs
- Practice assignment declines feed Planner's calibration

### 5.2 HITL gates per feature

| Feature | Gate type | What requires human approval | Why structural |
|---|---|---|---|
| **Coach** | Soft | Coach analysis committed to portfolio | Hallucinated critique would corrupt aesthetic_profile and downstream coaching |
| **Mentor Copilot** | Soft (conversational) | Multi-turn conversation IS the HITL | Without conversational steering, multi-turn reasoning would drift |
| **Planner** | Soft | Every proposed assignment requires user accept/decline/modify | Bad assignments waste user time and degrade skill development |
| **Reflection** | Soft | Skill delta interpretation can be overridden | Wrong delta would mislead photographer about progress |
| **Triage** | **Hard** for deletions, soft for tags | Individual photo deletion requires explicit approve; bulk tag commits require batch approval | Deletions irreversible; bad bulk tagging corrupts search |
| **Print Sales Strategist** | **Hard** for publications | Every listing requires explicit approve before publication. Every pricing override required. | Financial implications: bad pricing or wrong listing = lost revenue or platform violations |
| **Visual Describer** | Soft (voice-mediated) | Scene description corrections via voice; recomposition acceptance via voice/haptic | Wrong descriptions could mislead vision-impaired users about what they captured |
| **Field Coach** | Soft (ambient) | User can mute, override suggestions, ignore prompts | Pushy real-time coaching that can't be overridden would be hostile |

### 5.3 HITL behavior per persona

| Persona | HITL philosophy | Specific behavior |
|---|---|---|
| **Hobbyist** | Light touch | Practice assignments proposed in a "card" UI that can be dismissed without explicit decline |
| **Working Pro** | Stronger HITL — financial implications | Listing previews shown with full marketplace metadata; approval is a deliberate action; NO batch-approve without explicit "auto-approve" toggle |
| **Photographer with Vision Impairment** | Voice-first HITL | "Confirm capture" voice prompt before any state-changing action; haptic pulse confirms acceptance |

### 5.4 The training-signal loop

User overrides write to MongoDB and reshape future agent behavior:

- **Triage tag override** → `aesthetic_profile` updated via change stream → next Coach analysis grounds in updated profile
- **Coach score override** → flagged in `portfolio_entries.user_overrides`, used as calibration signal for future Coach prompts
- **Print Sales listing edit** → marketplace-specific patterns updated in `print_sales` metadata → next draft for that marketplace reflects user preferences
- **Visual Describer scene correction** → updates `users.preferences.description_style` → future Visual Describer outputs adapt
- **Planner assignment decline** → recorded in `practice_assignments` with reason → Planner avoids similar shapes for that user

### 5.5 Why this passes the "structural not decorative" test

1. **Gates required by problem, not rubric** — deletions, marketplace publications, financial actions have irreversible/costly consequences
2. **Gates differ across personas** — working pros have stricter financial-action gates; vision-impaired users have voice-first gates
3. **Override loop is real** — corrections genuinely improve the system over time via MongoDB-backed state

### 5.6 HITL in the demo (per §10 demo script)

Two HITL moments must be visible in the 3-minute demo:

- **Working pro Print Sales segment** — Print Sales Strategist proposes 5 listings. User reviews each, modifies price on one, removes one, approves remaining 4. Approve is *deliberate* per-listing, not batch.
- **Persona switch segment** — When persona switches to vision_impairment, HITL modality switches with it. "Would you like to recompose?" is voice-mediated; user responds verbally; haptic confirms response was understood.

### 5.7 HITL implementation requirements (testable, not conceptual)

**MongoDB collection: `pending_approvals`**

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "agent_name": "string (which sub-agent proposed)",
  "proposed_action": {
    "type": "delete_photo | publish_listing | commit_assignment | apply_tags | ...",
    "target_id": "ObjectId or string",
    "payload": "object (the proposed change)"
  },
  "agent_reasoning": "string (Glass Box explanation)",
  "status": "pending | approved | modified | rejected",
  "user_decision": {
    "action": "approve | modify | reject | null",
    "override_payload": "object | null (if modified)",
    "decided_at": "ISODate | null"
  },
  "created_at": "ISODate"
}
```

**Hard gate enforcement (Triage delete, Print Sales publish):**

```python
# WRONG — agent autonomously deletes
def triage_delete_photo(photo_id):
    portfolio_entries.delete_one({"_id": photo_id})  # NEVER do this

# CORRECT — agent proposes; user approves
def triage_propose_deletion(photo_id, reasoning):
    pending_approvals.insert_one({
        "user_id": current_user_id,
        "agent_name": "triage",
        "proposed_action": {"type": "delete_photo", "target_id": photo_id, "payload": {}},
        "agent_reasoning": reasoning,
        "status": "pending",
        "created_at": now()
    })
    # UI shows approval card; user must explicitly approve before deletion executes
```

**UI flow requirements:**

For hard gates:
1. Approval card displayed with: agent name, proposed action description, agent's reasoning (Glass Box)
2. Three explicit buttons: "Approve", "Modify", "Reject" — NOT auto-dismiss on tap outside
3. For working_pro Print Sales: each listing requires its own approval card (NO batch-approve without explicit `auto_approve_listings=true` user preference)

For soft gates:
1. Suggestion shown with reasoning
2. User can accept (one tap), modify (opens edit form), or ignore (auto-dismiss after N seconds)
3. Modifications captured as override events

For voice-mediated HITL (vision_impairment):
1. Voice prompt before any state-changing action: *"I'd like to [action]. Say 'yes', 'modify', or 'no'."*
2. Voice acknowledgment captured to `capture_sessions.voice_interactions`
3. Haptic pulse on the device confirms voice response was received

**State machine and mutability semantics (authoritative):**

| State | How entered | What's mutable while in this state | Valid transitions out |
|---|---|---|---|
| `pending` | Document created by sub-agent | NONE for fields `proposed_action`, `agent_reasoning`, `agent_name`, `created_at` — these are FROZEN at creation. Only `status` field can change (and `user_decision` populates atomically with the status transition). | → `approved`, `modified`, `rejected`, or `expired` |
| `approved` | User explicit approve | NONE — document is fully immutable. `user_decision` populated with `action=approve`, `decided_at=now`. | (terminal) |
| `modified` | User explicit modify | NONE — document is fully immutable. `user_decision` populated with `action=modify`, `override_payload`, `decided_at=now`. | (terminal) |
| `rejected` | User explicit reject | NONE — document is fully immutable. `user_decision` populated with `action=reject`, `decided_at=now`. | (terminal) |
| `expired` | System auto-expires after N hours (default 168h = 7 days; configurable per persona) | NONE — document is fully immutable. `user_decision.action=null`, `decided_at` set to expiration timestamp. | (terminal) |

**Critical rule — no in-place agent revisions:** Once a `pending_approvals` document exists, neither the agent nor the system may modify `proposed_action`, `agent_reasoning`, or `agent_name`. If the agent's understanding changes after proposing (e.g., new context arrives), a NEW `pending_approvals` document MUST be created and the original `pending` document MUST be transitioned to `rejected` with `user_decision.action=null` and a system-recorded note `superseded_by=<new_id>` in a separate `superseded_links` collection or a system metadata field.

**Critical rule — atomic transitions:** The status transition from `pending` to any terminal state and the population of `user_decision` MUST be a single atomic MongoDB update operation. Two-step writes (first status, then user_decision, or vice versa) are NOT permitted — they create audit windows where the document is in an inconsistent state.

**Why this matters:** Without immutability semantics, the audit trail is meaningless. A judge or auditor must be able to reconstruct exactly what was proposed at what time and what the user decided. Mutable proposals defeat that. The training-signal loop (§5.4) also depends on stable, queryable history — if `proposed_action` can be retroactively edited, sub-agent calibration based on user overrides becomes unreliable.

**Audit log queries:**

Full history per user (all states, ordered):
```python
db.pending_approvals.find({"user_id": uid}).sort("created_at", 1)
```

Only completed decisions (for sub-agent override calibration):
```python
db.pending_approvals.find({
    "user_id": uid,
    "status": {"$in": ["approved", "modified", "rejected"]}
})
```

**Override capture data model:**

User overrides are written to:
- `pending_approvals.user_decision.override_payload` (the modified version)
- `users.preferences.override_history` (rolling array of recent overrides for that user, for sub-agent calibration)

The override_history is read by the relevant sub-agent at the start of its next invocation:

```python
class TriageAgent(LlmAgent):
    def __init__(self):
        super().__init__(
            instruction=load_prompt_with_user_overrides("triage")
        )

def load_prompt_with_user_overrides(agent_name):
    base = open(f"app/prompts/{agent_name}.txt").read()
    overrides = get_recent_overrides(current_user_id, agent_name, limit=20)
    if overrides:
        return base + "\n\nRecent user overrides to consider:\n" + format_overrides(overrides)
    return base
```

This makes the training-signal loop concrete: overrides are stored, retrieved, and injected into the next invocation's instruction.

---

## 6. MongoDB schema

### 6.1 Database: `practice_companion`

### 6.2 Collections

**`users`** — persona drives orchestration; preferences drive HITL behavior
```json
{
  "_id": "ObjectId",
  "email": "string",
  "display_name": "string",
  "persona": "hobbyist | working_pro | vision_impairment",
  "preferences": {
    "voice_enabled": "boolean",
    "haptic_enabled": "boolean",
    "auto_approve_listings": "boolean (default false; working_pro only)",
    "description_style": "concise | detailed (vision_impairment only)",
    "preferred_genres": ["string"],
    "override_history": [{
      "agent": "string",
      "override_type": "string",
      "original": "object",
      "modified": "object",
      "timestamp": "ISODate"
    }]
  },
  "created_at": "ISODate"
}
```

**`portfolio_entries`** — base schema for all personas, extended with persona-specific fields
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "shoot_id": "ObjectId",
  "image_url": "string",
  "thumbnail_url": "string",
  "exif": { /* parsed EXIF */ },
  "scores": {
    "composition": "number 0-10",
    "lighting": "number 0-10",
    "technique": "number 0-10",
    "creativity": "number 0-10",
    "subject_impact": "number 0-10"
  },
  "glass_box": {
    "observations": ["string"],
    "reasoning_steps": ["string"],
    "priority_fixes": [{ "severity": "critical|moderate|minor", "issue": "string" }],
    "grounding_principles": ["string"]
  },
  "spatial_metadata": {
    "annotations": [{ "bbox": [x,y,w,h], "severity": "string", "note": "string" }],
    "subject_relationships": {
      "primary_subject_position": "string",
      "secondary_subjects": [{ "position": "string", "relationship_to_primary": "string" }],
      "depth_axis": "string",
      "leading_lines_present": "boolean"
    },
    "lighting_map": {
      "key_light_direction": "string",
      "fill_light_strength": "string",
      "rim_light_present": "boolean",
      "color_temperature": "string",
      "shadow_character": "string"
    }
  },
  "aesthetic_tags": ["string"],
  "embedding": [/* 1408-dim Vertex AI multimodalembedding@001 */],
  "user_overrides": [{ "field": "string", "original": "any", "modified": "any", "timestamp": "ISODate" }],

  // Vision impairment persona enrichment (only populated for this persona)
  "scene_description": "string (optional)",
  "capture_intent": "string (optional)",
  "audio_transcript": "string (optional)",
  "haptic_pattern_used": "string (optional)",

  // Working pro enrichment
  "client_id": "ObjectId (optional)",
  "delivered_in_gallery": "ObjectId (optional)",

  "created_at": "ISODate"
}
```

**`practice_assignments`**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "status": "proposed | active | completed | declined",
  "brief": "string",
  "target_skill": "string",
  "rationale": "string",
  "persona_context": "hobbyist | working_pro | vision_impairment",
  "baseline_shoot_ids": ["ObjectId"],
  "completion_shoot_ids": ["ObjectId"],
  "skill_delta": {
    "metric": "string",
    "baseline_value": "number",
    "current_value": "number",
    "delta": "number"
  },
  "decline_reason": "string (optional; captured if user declines)",
  "created_at": "ISODate",
  "completed_at": "ISODate | null"
}
```

**`conversations`**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "thread_id": "string",
  "messages": [{
    "role": "user | assistant",
    "content": "string",
    "tool_calls": [{ "agent": "string", "tool": "string", "input": "object", "output": "object" }],
    "timestamp": "ISODate"
  }],
  "summary": "string",
  "last_active": "ISODate"
}
```

**`aesthetic_profile`** — derived per user, refreshed via change stream
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "dominant_tones": ["string"],
  "preferred_lighting": ["string"],
  "subject_patterns": ["string"],
  "stylistic_consistency_score": "number 0-1",
  "evolution_trajectory": "string (one paragraph)",
  "computed_at": "ISODate",
  "computed_from_portfolio_size": "number"
}
```

**`client_outcomes`** (working pro persona)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "client_id": "ObjectId",
  "shoot_id": "ObjectId",
  "delivered_gallery_size": "number",
  "client_selected_count": "number",
  "conversion_rate": "number 0-1",
  "client_feedback": "string",
  "client_preference_signals": ["string"],
  "delivered_at": "ISODate"
}
```

**`print_sales`** (working pro persona)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "portfolio_entry_id": "ObjectId",
  "marketplace": "etsy | society6 | redbubble | saatchi_art | other",
  "marketplace_listing_metadata": { /* flexible per marketplace */ },
  "list_price": "number",
  "currency": "string",
  "units_sold": "number",
  "revenue": "number",
  "user_listing_edits": [{ "field": "string", "original": "any", "modified": "any" }],
  "listed_at": "ISODate",
  "first_sale_at": "ISODate | null"
}
```

**`capture_sessions`** (vision impairment persona)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "started_at": "ISODate",
  "ended_at": "ISODate",
  "location_description": "string",
  "voice_interactions": [{
    "user_said": "string",
    "agent_said": "string",
    "haptic_pattern": "string",
    "frame_captured": "boolean",
    "portfolio_entry_id": "ObjectId | null",
    "timestamp": "ISODate"
  }]
}
```

**`pending_approvals`** (HITL — see §5.7)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "agent_name": "string",
  "proposed_action": { "type": "string", "target_id": "string", "payload": "object" },
  "agent_reasoning": "string",
  "status": "pending | approved | modified | rejected",
  "user_decision": {
    "action": "approve | modify | reject | null",
    "override_payload": "object | null",
    "decided_at": "ISODate | null"
  },
  "created_at": "ISODate"
}
```

### 6.3 Indexes

**`portfolio_entries`:**
- Vector index on `embedding` (Atlas Vector Search, 1408 dimensions, cosine)
- **Atlas Search index `glass_box_search`:** fields `glass_box.observations`, `glass_box.reasoning_steps`, `glass_box.priority_fixes.issue`, `aesthetic_tags`
- **Atlas Search index `scene_search`** (NEW for vision_impairment): fields `scene_description`, `capture_intent`, `audio_transcript`
- Compound `(user_id, created_at)`
- Single `shoot_id`
- Sparse single `client_id`

**`practice_assignments`:** compound `(user_id, status)`

**`conversations`:** compound `(user_id, last_active)`

**`aesthetic_profile`:** single `user_id`

**`client_outcomes`:** compound `(user_id, client_id, delivered_at)`

**`print_sales`:** compound `(user_id, marketplace, listed_at)`, sparse `first_sale_at`

**`capture_sessions`:** compound `(user_id, started_at)`

**`pending_approvals`:** compound `(user_id, status, created_at)`, sparse `(user_id, agent_name)`

### 6.4 Change stream subscriptions

- `portfolio_entries` insert → trigger `aesthetic_profile` derivation for affected `user_id`
- `print_sales` insert → trigger ROI re-aggregation for working pro
- `capture_sessions` complete → trigger scene description indexing for vision impairment persona

### 6.5 Reference to companion document

**Companion document requirement:** This spec references the MongoDB load-bearing partner argument from §6.5, §10, §11, and §15. That document MUST exist at `/docs/mongodb-story-document.md` in the project repo before Phase 5 (Devpost text writing). If it does not exist at that location, the Devpost text cannot quote from it.

**Status:** The companion document has been independently delivered at `/mnt/user-data/outputs/mongodb-story-document.md` and contains: thesis (operational simplicity argument), MongoDB primitives × features matrix, MongoDB primitives × personas matrix, three cross-channel user journeys, honest competitive framing (Firestore/Postgres+pgvector alternatives acknowledged), and five Devpost-ready talking points.

**Action required in Phase 0:** Copy `/mnt/user-data/outputs/mongodb-story-document.md` into the project repo at `/docs/mongodb-story-document.md`. Phase 0 gate includes verification: `test -f docs/mongodb-story-document.md || exit 1`.

---

## 7. Agent definitions

Each of the 8 sub-agents is its own `LlmAgent` instance with its own file, prompt (≥30 lines), and distinct tools.

### 7.1 Orchestrator (`app/agent.py`)

**Role:** Receives all user input. Looks up persona. Builds persona-filtered toolset (§4.3). Parses intent. Decides which sub-agent(s) to invoke (sequential or parallel). Synthesizes final response.

**Tools:** Dynamic per persona via `build_persona_filtered_tool_list()`. See §4.3 (with §2.3 as illustrative pattern).

**Instruction:** `app/prompts/orchestrator.txt` — ≥80 lines covering:
- Persona-aware routing matrix (§4.2)
- Sequential vs parallel decision logic
- Edge case handling (§4.4)
- Re-planning behavior when sub-agent results contradict assumptions
- HITL gate triggering (when to create `pending_approvals` documents)

### 7.2 Coach sub-agent (`app/sub_agents/coach.py`)

**Role:** Single-photo multimodal analysis. 5-axis scoring, Glass Box reasoning, spatial metadata, principle grounding.

**Tools (≥1 unique to Coach):**
- `analyze_image_multimodal` — Gemini 3 Pro vision call, structured JSON output **[UNIQUE]**
- `ground_in_data_store_principles` — queries Agent Builder Data Store for relevant principles based on scene type **[shared with Mentor]**
- `write_portfolio_entry` — PyMongo write with embedding **[UNIQUE]**
- `generate_multimodal_embedding` — Vertex AI multimodalembedding@001 call **[UNIQUE]**

**Instruction:** `app/prompts/coach.txt` — covers 5-axis schema, Glass Box format, grounding principles, spatial annotation requirements, persona-aware tone

### 7.3 Mentor sub-agent (`app/sub_agents/mentor.py`)

**Role:** Multi-turn conversational mentor. Orchestrates information retrieval across portfolio/practice/conversations/profile to answer open-ended questions.

**Tools (≥1 unique to Mentor):**
- `atlas_search_glass_box` — full-text search over critique content using `glass_box_search` index **[UNIQUE]**
- `vector_search_similar_photos` — visual similarity via Atlas Vector Search **[UNIQUE]**
- `ground_in_data_store_principles` — **[shared with Coach]**
- `get_aesthetic_profile_summary` — **[shared with Reflection]**
- `get_recent_portfolio_aggregates_by_time` — time-windowed aggregation **[UNIQUE]** (distinct from Planner's `get_portfolio_aggregates_by_skill`)

**Instruction:** `app/prompts/mentor.txt` — intent classification, multi-source synthesis, conversation state management, persona-aware tone

### 7.4 Planner sub-agent (`app/sub_agents/planner.py`)

**Role:** Generates next practice assignment based on portfolio analysis + active assignments + aesthetic profile + persona context.

**Tools (≥1 unique to Planner):**
- `get_portfolio_aggregates_by_skill` — aggregation grouped by target_skill **[UNIQUE]** (distinct from Mentor's time-windowed aggregation)
- `get_active_assignment` — **[shared with Reflection]**
- `write_practice_assignment` — **[UNIQUE]**
- `query_client_outcomes` — working_pro persona only **[UNIQUE]**
- `query_data_store_principles_for_assignment` — fetches principles to ground assignment rationale **[UNIQUE]** (distinct from Coach's grounding which focuses on scene-type principles)

**Instruction:** `app/prompts/planner.txt` — persona-aware planning (skill-development for hobbyist, business-aware for working pro), rationale generation, calibration

### 7.5 Reflection sub-agent (`app/sub_agents/reflection.py`)

**Role:** Multi-image comparison between baseline and completion shoots. Compute skill delta.

**Tools (≥1 unique to Reflection):**
- `get_shoot_photos_with_scores` — **[UNIQUE]**
- `compare_multimodal_embeddings` — cross-shoot vector comparison **[UNIQUE]**
- `write_skill_delta_to_assignment` — **[UNIQUE]**
- `get_aesthetic_profile_summary` — **[shared with Mentor]**
- `get_active_assignment` — **[shared with Planner]**

**Instruction:** `app/prompts/reflection.txt` — ISAR computation for hobbyist, conversion delta for working pro, before/after framing

### 7.6 Triage sub-agent (`app/sub_agents/triage.py`)

**Role:** Bulk operation across large portfolio archives. Cluster by similarity, surface duplicates, suggest tags, identify forgotten gems.

**Tools (≥1 unique to Triage):**
- `cluster_portfolio_by_embedding` — vector clustering **[UNIQUE]**
- `propose_bulk_tag_application` — writes `pending_approvals` for batch tag changes **[UNIQUE]**
- `find_duplicate_portfolio_entries` — **[UNIQUE]**
- `surface_top_scoring_untouched_photos` — **[UNIQUE]**
- `propose_photo_deletion` — writes `pending_approvals` for individual deletions (HARD HITL gate) **[UNIQUE]**

**Instruction:** `app/prompts/triage.txt` — clustering strategy, when to propose vs proceed, conflict resolution, never autonomously delete

### 7.7 Print Sales Strategist sub-agent (`app/sub_agents/print_sales.py`) — working_pro persona only

**Role:** Analyze portfolio for print-saleability per marketplace. Recommend products. Generate listings.

**Tools (≥1 unique to Print Sales):**
- `get_print_sales_history` — **[UNIQUE]**
- `vector_search_similar_to_top_sellers` — **[UNIQUE]**
- `aggregate_roi_by_marketplace` — **[UNIQUE]**
- `generate_listing_metadata` — Gemini call with marketplace-specific formatting **[UNIQUE]**
- `propose_listing_publication` — writes `pending_approvals` per listing (HARD HITL gate) **[UNIQUE]**
- `get_aesthetic_profile_summary` — **[shared with Mentor, Reflection]**

**Instruction:** `app/prompts/print_sales.txt` — per-marketplace strategy, pricing reasoning, listing draft format, never autonomously publish

### 7.8 Visual Describer sub-agent (`app/sub_agents/visual_describer.py`) — vision_impairment persona only

**Role:** Real-time scene description, spatial composition guidance, persistent scene memory for auditory recall.

**Tools (≥1 unique to Visual Describer):**
- `analyze_frame_for_description` — Gemini vision call with description-focused prompt (distinct from Coach's critique-focused prompt) **[UNIQUE]**
- `compute_spatial_position` — geometric analysis of subject placement **[UNIQUE]**
- `trigger_haptic_pattern` — iOS haptic command **[UNIQUE]**
- `narrate_capture_session` — multi-frame narration **[UNIQUE]**
- `atlas_search_scene_descriptions` — uses `scene_search` index **[UNIQUE]**
- `write_capture_session_event` — **[UNIQUE]**

**Instruction:** `app/prompts/visual_describer.txt` — description format (concise/detailed per user preference), spatial-first language, accessibility-aware, when to suggest recomposition, haptic pattern selection

### 7.9 Field Coach sub-agent (`app/sub_agents/field_coach.py`) — 9th LlmAgent

**Role:** Sub-orchestrator for the iPhone field-capture flow. Receives camera frames + session state. Decides which other sub-agents to invoke (Coach for analysis, Visual Describer for description in vision_impairment mode, Mentor for assignment context).

**Tools (≥1 unique to Field Coach):**
- `get_session_state` — fetches current field session state including recent suggestions **[UNIQUE]**
- `update_session_state` — writes to session for next-frame stateful coaching **[UNIQUE]**
- `AgentTool(agent=coach_agent)` — invoke Coach for sighted-mode analysis
- `AgentTool(agent=visual_describer_agent)` — invoke Visual Describer for vision_impairment mode (note: this AgentTool is conditionally included based on persona at session start)
- `AgentTool(agent=mentor_agent)` — invoke Mentor for assignment context
- `decide_when_to_speak` — anti-interruption logic; agent must reason about whether to voice a suggestion **[UNIQUE]**

**Instruction:** `app/prompts/field_coach.txt` — real-time decision-making, anti-interruption rules, persona-aware delegation (Coach for sighted, Visual Describer for vision_impairment), assignment-aware coaching

### 7.10 Tool uniqueness justification

For each pair of sub-agents that share read patterns on the same collection, here's why the tools are genuinely different jobs:

| Sub-agent A | Sub-agent B | Same collection? | Different because |
|---|---|---|---|
| Mentor `get_recent_portfolio_aggregates_by_time` | Planner `get_portfolio_aggregates_by_skill` | Yes (portfolio_entries) | Different aggregation pipelines: Mentor groups by time-window for trend analysis; Planner groups by target_skill for gap analysis. Different output shapes, different consumers. |
| Coach `ground_in_data_store_principles` | Planner `query_data_store_principles_for_assignment` | Yes (Data Store) | Different queries: Coach retrieves scene-type principles for inline analysis; Planner retrieves practice-design principles for assignment rationale. Different prompt frames, different results. |
| Reflection `compare_multimodal_embeddings` | Print Sales `vector_search_similar_to_top_sellers` | Yes (portfolio_entries.embedding) | Different operations: Reflection compares baseline vs completion shoot embeddings (within-user); Print Sales does cross-portfolio nearest-neighbor against sold-photos cluster. |
| Triage `cluster_portfolio_by_embedding` | Mentor `vector_search_similar_photos` | Yes (portfolio_entries.embedding) | Different operations: Triage clusters all portfolio entries; Mentor does single-photo nearest-neighbor search. Different algorithms (k-means vs ANN), different output shapes. |
| Reflection `get_active_assignment` | Planner `get_active_assignment` | Yes (practice_assignments) | Same underlying read, intentionally shared. Both sub-agents need to know the active assignment but for different reasons. This is a legitimately shared tool. |

If during implementation a tool ends up being structurally identical to one in another sub-agent (not just sharing name but same logic), it should be promoted to a shared utility and noted in this table.

---

## 8. Phase plan (through June 11)

### 8.0 Formal 8-agent fallback profile

The default target is 9 LlmAgents (§3.5). If Phase 1 verifiably fails to produce 9 agents passing all §2.4 commands by EOD May 30, **Prasad** may activate this formal 8-agent fallback profile. **The AI coding tool MUST NOT activate this fallback on its own discretion.** Activation requires explicit human authorization in the conversation, e.g., "Activate the §8.0 fallback profile."

**What changes in fallback mode:**

- Triage sub-agent is dropped (rationale: least demo-critical; clustering-based bulk operations are the most complex sub-agent to build correctly)
- LlmAgent count target: **8** (1 orchestrator + 7 sub-agents)
- Sub-agent files target: **7**
- Prompt files target: **8**
- `app/sub_agents/triage.py` and `app/prompts/triage.txt` are NOT created
- Backlog Triage Agent feature is deferred to post-hackathon
- Demo script segment 2:20-2:50 (Triage moment) is replaced with extended persona-switching segment or dropped entirely

**Verification commands in fallback mode:**

```bash
LLM_AGENT_COUNT=$(grep -rh "LlmAgent(" app/ | grep -v "^#" | wc -l)
test $LLM_AGENT_COUNT -eq 8 || exit 1

SUB_AGENT_COUNT=$(ls app/sub_agents/*.py 2>/dev/null | wc -l)
test $SUB_AGENT_COUNT -eq 7 || exit 1

PROMPT_COUNT=$(ls app/prompts/*.txt 2>/dev/null | wc -l)
test $PROMPT_COUNT -eq 8 || exit 1

AGENT_TOOL_COUNT=$(grep "AgentTool(agent=" app/agent.py | wc -l)
test $AGENT_TOOL_COUNT -ge 7 || exit 1
```

**Persona availability in fallback mode:**

**Status (June 2026):** §8.0 fallback was **not activated**. Production ships all **9 LlmAgents** (§3.2). Session counts below are the obsolete fallback plan only; live counts match §3.2 and `docs/compliance-proof/evidence/agent-graph.json`.

- Hobbyist session: 5 sub-agents + orchestrator = **6 agents** (fallback plan; production: 6 + orchestrator = **7**, §3.2)
- Working Pro session: 7 sub-agents + orchestrator = **8 agents available in this session** (production, §3.2; fallback plan without Triage would be 6 + orchestrator = 7)
- Vision Impairment session: 6 sub-agents + orchestrator = **7 agents** (**unchanged** — Triage was never in this persona's toolset)

**Floor rule:** The 8-agent fallback is itself a target. Once activated, no further reduction is permitted by the AI coding tool. Any further degradation (to 7 or fewer) must be explicitly authorized by Prasad in a fresh authorization message.

**Devpost / judge framing in fallback mode:** "Practice Companion ships with 8 specialized agents (1 orchestrator + 7 sub-agents). A 9th agent (Backlog Triage) was scoped but deferred to focus on shipping the demo-critical features at higher quality. This is documented in the README."


### Phase 0 — Setup verification (May 24-25, 1-2 days)

**[MANUAL] Mac + iOS prerequisites:**
- [ ] Mac available with Xcode 15+ installed
- [ ] Apple Developer Program enrollment status verified (enroll today if not active; 1-3 day verification window)
- [ ] If no Mac: confirm fallback to Capacitor PWA wrap (see §3.4)

**[MANUAL] Verify existing infrastructure still works:**
- [ ] MongoDB Atlas cluster reachable (`practice-photography-companion-mvp-cluster`)
- [ ] Firebase Hosting deploys successfully
- [ ] Vertex AI Gemini 3 Pro accessible
- [ ] Agent Builder Data Store reachable
- [ ] GCS bucket accessible

**[AUTO] Execute v3 → v5 file migration per §1.5.** Run verification commands in §1.5 to confirm.

**[AUTO] Update MongoDB schema:**
- [ ] Add `persona` field to `users` collection (default: `hobbyist` for existing users)
- [ ] Add `preferences` subdocument to `users`
- [ ] Create new collections: `client_outcomes`, `print_sales`, `capture_sessions`, `pending_approvals`
- [ ] Create Atlas Search index `scene_search` for vision_impairment persona

**[AUTO] Copy companion document into repo:**
- [ ] `/mnt/user-data/outputs/mongodb-story-document.md` → `docs/mongodb-story-document.md`

**Gate (verified by commands, not subjective):**
- [ ] §1.5 verification commands pass (old files deleted, new structure created)
- [ ] `python -c "from pymongo import MongoClient; print(MongoClient('$MONGODB_URI').list_database_names())"` returns the database
- [ ] All new collections exist with their indexes (`db.collection.getIndexes()` for each)
- [ ] `test -f docs/mongodb-story-document.md` passes (companion document in place)

### Phase 1 — Multi-agent rewire (May 26-29, 4 days)

**The critical phase.** This is where v3 diverged. Do not let it happen again.

**[AUTO] Implement each of the 8 sub-agents in `app/sub_agents/*.py` as proper `LlmAgent` instances.** Each must have:
- Its own `instruction` loaded from `app/prompts/<name>.txt` (≥30 lines)
- Its own `tools=[...]` per §7
- Its own Gemini call (model="gemini-3-pro" or equivalent, NOT inherited from orchestrator)

**[AUTO] Implement `app/agent.py` orchestrator** using `AgentTool(agent=...)` for each sub-agent + `build_persona_filtered_tool_list()` per **§4.3** (with §2.3 as illustrative pattern).

**[AUTO] Set up trace instrumentation** (OpenInference + Cloud Trace) to capture per-agent spans.

**Verification gate (all §2.4 commands must pass):**

```bash
# All verification commands from §2.4
LLM_AGENT_COUNT=$(grep -rh "LlmAgent(" app/ | grep -v "^#" | wc -l)
test $LLM_AGENT_COUNT -eq 9 || exit 1

SUB_AGENT_COUNT=$(ls app/sub_agents/*.py 2>/dev/null | wc -l)
test $SUB_AGENT_COUNT -eq 8 || exit 1

PROMPT_COUNT=$(ls app/prompts/*.txt 2>/dev/null | wc -l)
test $PROMPT_COUNT -eq 9 || exit 1

for f in app/prompts/*.txt; do
    test $(wc -l < "$f") -ge 30 || exit 1
done

AGENT_TOOL_COUNT=$(grep "AgentTool(agent=" app/agent.py | wc -l)
test $AGENT_TOOL_COUNT -ge 8 || exit 1
```

**Behavioral verification (concrete input → output):**
- [ ] Playground query "critique this photo" + image triggers orchestrator → Coach sub-agent, trace shows ≥2 LLM spans
- [ ] Playground query "what should I work on?" + hobbyist persona triggers orchestrator → Planner, response includes assignment rationale
- [ ] Playground query "which photos should I sell?" + hobbyist persona returns the persona-switch fallback message per §4.4

**Runtime persona-isolation verification (§2.4.b):**
- [ ] `python -m pytest tests/test_persona_isolation.py -v` passes all 4 tests (or 4 tests adjusted for fallback mode per §8.0)

**Fallback if Phase 1 incomplete by EOD May 30:** See §8.0 Formal 8-agent fallback profile. Activation requires explicit human authorization from Prasad — the AI coding tool MUST NOT activate this on its own.

### Phase 2 — Persona routing + Mentor Copilot (May 30-Jun 2, 4 days)

**[AUTO] Implement persona detection in orchestrator** (read from `users.persona`).
**[AUTO] Implement intent classification in orchestrator prompt.**
**[AUTO] Wire Mentor sub-agent for chat-based interactions.**
**[AUTO] Build Mentor Chat UI in React** (new tab; doesn't replace existing tabs).
**[AUTO] Deploy orchestrator to Vertex AI Agent Engine** OR Cloud Run with session API (whichever works first; document choice in deploy.md).
**[AUTO] Wire frontend chat to orchestrator endpoint.**

**Verification gate (concrete input → output):**

For each of the following 5 canonical queries, verify the routing matches expectation AND the trace shows the right spans:

1. **Query:** "show me my recent backlit portraits" (hobbyist persona)
   **Expected:** Orchestrator → Mentor → (parallel: `atlas_search_glass_box` with "backlit" + `vector_search_similar_photos` filtered to user). Trace ≥3 LLM spans.

2. **Query:** "I just finished my backlit subjects assignment, here are the new photos" + 5 images (hobbyist)
   **Expected:** Orchestrator → Coach (x5 sequentially) → Reflection (with baseline shoot_id) → Planner. Trace ≥7 LLM spans showing sequential delegation.

3. **Query:** "what's distinctive about my work?" (hobbyist)
   **Expected:** Orchestrator → Mentor → (parallel: `get_aesthetic_profile_summary` + `get_recent_portfolio_aggregates_by_time` + `atlas_search_glass_box`). Synthesizes "your photographic voice" narrative.

4. **Query:** "which photos would do well on Etsy?" (hobbyist persona)
   **Expected:** Orchestrator returns persona-switch fallback message per §4.4 ("That capability is available in Working Pro mode..."). Print Sales NOT invoked.

5. **Query:** "which photos would do well on Etsy?" (working_pro persona)
   **Expected:** Orchestrator → Print Sales Strategist → (calls `get_print_sales_history` + `vector_search_similar_to_top_sellers` + `generate_listing_metadata`). Returns ranked recommendations with draft listings.

### Phase 3 — iPhone Field Coach + Triage Agent (Jun 3-6, 4 days)

**[AUTO] Scaffold native iOS app in SwiftUI** (per §3.4 commitment).
**[AUTO] Implement live camera capture via AVFoundation, frame throttling, agent call pipeline.**
**[AUTO] Implement Field Coach flow:** frame → orchestrator → Field Coach sub-agent → (Coach for sighted OR Visual Describer for vision_impairment) → voice/haptic feedback.
**[AUTO] Implement haptic feedback engine** (`UIImpactFeedbackGenerator` + composition guidance patterns).
**[AUTO] Implement ARKit composition overlays** (rule of thirds, leading lines, golden ratio).
**[AUTO] Implement voice synthesis via AVSpeechSynthesizer.**
**[AUTO] Implement Triage Agent for web** (Backlog Triage UI + bulk operations + HITL approval flow per §5.7).

**[MANUAL] Submit first TestFlight build for external review by Jun 5.**

**Verification gate (concrete input → output):**
- [ ] iPhone app captures frame, sends to orchestrator endpoint, receives feedback within 3 seconds
- [ ] Persona toggle switches between visual+voice (sighted, ARKit overlays visible) and voice+haptic (vision_impairment, haptic pulses on subject centering)
- [ ] Triage Agent processes 50+ photos, surfaces 3+ clusters, proposes tags via `pending_approvals` (no autonomous tag commits)
- [ ] Deletion proposed by Triage requires explicit user approval card (no auto-delete)

### Phase 4 — Print Sales Strategist + Visual Describer polish (Jun 6-8, 3 days)

**[AUTO] Implement Print Sales Strategist sub-agent** with `propose_listing_publication` HITL gate.
**[AUTO] Build Print Sales UI in working-pro mode** (web + mobile) with per-listing approval cards.
**[AUTO] Polish Visual Describer voice flow and haptic patterns.**
**[AUTO] Seed demo data for all three personas across all features.**

**Verification gate:**
- [ ] Working pro user can navigate to Print Sales tab, see 5 listing proposals, approve/modify/reject each individually
- [ ] No batch-approve button unless `users.preferences.auto_approve_listings = true`
- [ ] Vision impairment demo flow works end-to-end: camera open → scene narrated → user says "center the bench" → haptic guidance → confirmation pulse → capture
- [ ] Cross-session recall: vision impairment user asks "what did I capture today?" → Visual Describer narrates day's captures from `capture_sessions`

### Phase 5 — Demo polish + iOS approval + Devpost (Jun 9-10, 2 days)

**[AUTO] Record demo video** (3 minutes, all three personas, persona-switching moment highlighted).
**[AUTO] Write Devpost text** per §11.
**[AUTO] Update README** with multi-agent architecture diagram + trace examples + LlmAgent count verification.
**[AUTO] Confirm Apache-2.0 LICENSE visible in GitHub About.**
**[MANUAL] Monitor App Store review status; respond to any rejection feedback.**

**Verification gate:**
- [ ] Devpost submission preview complete
- [ ] Demo video shows persona-switching moment with visible architecture change
- [ ] README's "Verify Multi-Agent" section includes the §2.4 commands and their expected output

### Phase 6 — Submit (Jun 11)

Submit by noon PT, not 2pm deadline. Buffer for unexpected issues.

---

## 9. Deployment

### 9.1 Backend

- **Orchestrator + 8 sub-agents** deployed to **Vertex AI Agent Engine** as primary path
- **Fallback path: Cloud Run** hosting an ADK-based FastAPI service if Agent Engine integration has issues
- **MongoDB MCP Server** on Cloud Run (from v3 work; verify still functional)
- **Change stream listener** on Cloud Run (already exists from v3 work; verify)

### 9.2 Frontend (web)

- React on **Firebase Hosting** (existing v3 setup)
- Point `VITE_API_BASE_URL` at the Agent Engine endpoint (or Cloud Run fallback)

### 9.3 iOS native app — SwiftUI

- SwiftUI app deployed to **TestFlight** with public link (primary)
- Submit to **App Store** by Jun 5 (gives 6 days for review + resubmit cycle)
- Apple Developer Program enrollment required (Phase 0 prerequisite)
- If no Mac available: Capacitor wrap of existing React PWA (fallback, 6-10 hours, loses native ARKit/voice/haptics)

---

## 10. Demo script (3 minutes)

Structured around the **persona-switching moment** as the climax.

**0:00-0:20 — Setup**
Introduce the maker: hobbyist photographer using Practice Companion for two months. Show iPhone app.

**0:20-0:50 — Live Field Coach in sighted mode**
Open camera. Field Coach actively coaching. ARKit composition overlays + voice nudges. Show moment where Field Coach references active practice assignment ("you're working on backlit subjects, this is a good moment").

**0:50-1:20 — Mentor Copilot conversation**
Switch to web tab. Ask Mentor: "How am I improving on portraits?" **Show the trace:** Mentor invokes Atlas Search + portfolio aggregates + Reflection. Synthesizes narrative with citations. **This is where multiple sub-agents getting orchestrated is visible.**

**1:20-1:50 — The persona switch (the climax)**
Switch persona in settings to "photographer with vision impairment." Open iPhone camera again. **Same app. Same camera. Now fundamentally transformed.**
- ARKit overlays disappear
- Voice starts narrating the scene ("There's a wooden bench in the upper left, two meters away")
- Haptic feedback engages as user composes
- Confirmation pulse when subject is centered

**This is the moment that demonstrates the multi-agent architecture is real. Same infrastructure, different sub-agent composition (Visual Describer invoked instead of Coach), structurally different product.**

**1:50-2:20 — Working pro mode + HITL hard gate**
Switch to working pro. Show Print Sales Strategist: "Which photos should I list on Society6?" Agent returns 5 ranked recommendations. **Show explicit per-listing approval** — user modifies one price, rejects one, approves the remaining 3. Approve is deliberate per-listing (HARD HITL gate visible).

**2:20-2:50 — Backlog Triage moment**
Show Triage Agent processing a 200-photo backlog. Clusters surfaced. Forgotten gems identified. User approves suggested tags. **Show deletion proposal requiring explicit approval** (no autonomous deletion).

**2:50-3:00 — Close**
Three personas. Same iPhone. Same memory layer (MongoDB Atlas as memory substrate — link to mongodb-story-document.md). Real multi-agent architecture (9 LlmAgents). Adaptive to who you are.

**Trademark cautions:**
- Lightroom: describe as "industry-standard photo management software"; brief incidental Lightroom UI OK but no sustained logo focus
- MongoDB and Google Cloud logos: acceptable to show (partner and sponsor)
- All demo photos must be Prasad's own work or explicitly license-cleared

---

## 11. Devpost text plan

**Submission title / product name:** **Iris** (subtitle: AI photography mentor with persistent portfolio memory). Reference internal architecture as Practice Companion where needed for repo links.

Structure (~700-900 words):

1. **The problem (200 words)** — pedagogical gap in photography tools, three populations underserved, AOP 2026 stats on photographer economic pressure
2. **The product (200 words)** — three personas with structurally different agentic behavior, five agentic features, three channels, persona-switching as the demonstration. **Lead metric (Option 3):** hobbyist skill mentor, working-pro listing advisor, vision-impairment capture path — three distinct sub-agent compositions over one MongoDB-backed memory layer (native iOS voice/haptics after submission). **Positioning paragraph:** Iris complements Aftershoot/Imagen/Narrative (cull/edit) — mentor-and-evolve vs cull-and-deliver; see README and `mongodb-story-document.md`.
3. **The architecture (200 words)** — multi-agent orchestrator + 8 distinct sub-agents (9 total LlmAgents), MongoDB Atlas as memory substrate (link to mongodb-story-document.md), Agent Builder Data Store for principles, Gemini 3 Pro for reasoning, Vertex AI Agent Engine for hosting
4. **Honest gaps (75 words)** — v3 had agent theater problems explicitly fixed in v5; transparent about deterministic vs agentic flows; prior work attribution (gemini3, gemma4)
5. **Findings and learnings (150 words)** — what worked (ADK + Agent Engine + MongoDB MCP stack), what surprised (persona-based routing pattern), what we learned (kill-test discipline matters; partner-load-bearing claims need to be operationally honest)

---

## 12. Rules compliance checklist (inlined, no external reference)

### Submission essentials (rules §7.B)
- [ ] Hosted project URL works (Firebase Hosting frontend + Agent Engine backend reachable)
- [ ] TestFlight public link or App Store link active by Jun 11
- [ ] Code repository public, Apache-2.0 LICENSE visible in About section
- [ ] Demo video ≤ 3 minutes, YouTube or Vimeo, English (or English subtitled)
- [ ] MongoDB track selected on Devpost
- [ ] Devpost submission form complete with text description per §11

### Project requirements (rules §7.A, §7.B)
- [ ] Built with Gemini 3 Pro
- [ ] Built with Google Cloud Agent Builder (Data Store + ADK + Agent Engine ecosystem)
- [ ] Integrates MongoDB partner via MCP (MongoDB MCP Server is orchestrator's data interface)
- [ ] Runs on web AND iOS (native SwiftUI app per §3.4)
- [ ] Project newly created during contest period (May 5 - June 11, 2026); v5 rebuild from scratch in contest period; README attributes prior work

### Functionality restrictions (rules §7.B)
- [ ] No services competing with Google Cloud for hosting (Firebase + Cloud Run + Agent Engine; no Vercel, AWS, Azure)
- [ ] No services competing with MongoDB for database/search (MongoDB Atlas only; no Pinecone, Postgres+pgvector, Elasticsearch)
- [ ] Only Google Cloud AI tools and MongoDB AI features used (no Anthropic Claude, OpenAI, Cohere in runtime; Claude Code as dev tool is fine)

### Demo video content (rules §7.B)
- [ ] Shows project functioning on iPhone and web
- [ ] No third-party trademarks featured prominently (Lightroom per §10)
- [ ] No third-party IP violations (all demo photos Prasad's own or license-cleared)
- [ ] Original, unpublished work
- [ ] English or English-subtitled

### Repository content (rules §7.B)
- [ ] Public
- [ ] Apache-2.0 LICENSE at root, visible in GitHub About
- [ ] README documents what's reused from prior projects (gemini3, gemma4) and what's new in Practice Companion
- [ ] README includes "Verify Multi-Agent Architecture" section with §2.4 commands and expected output
- [ ] All necessary source code, assets, instructions present for the project to be functional
- [ ] No credentials, API keys, or service account files committed

### Multi-agent architectural claim (NEW — v5 specific)
- [ ] Exactly 9 LlmAgent instances in codebase (verified by §2.4 commands)
- [ ] Each sub-agent has ≥1 unique tool (verified by inspecting tool surfaces per §7)
- [ ] Persona enforcement at tool level (verified by inspecting `build_persona_filtered_tool_list`)
- [ ] Sequential and parallel orchestration both demonstrated in traces

### Eligibility (rules §4)
- [ ] Prasad above age of majority (German resident — confirmed eligible)
- [ ] Not in excluded jurisdiction
- [ ] Not Google/partner/Devpost employee

---

## 13. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Cursor/Claude Code reverts to anti-pattern 1 (Python services wrapped as FunctionTool) | **High** | §2 guardrails + §2.4 verification commands at every phase gate + §1.3 daily check-in prompt |
| Phase 1 multi-agent rewire takes longer than 4 days | **High** | Formal 8-agent fallback profile in §8.0 (human-activated only, by Prasad's explicit authorization) |
| App Store review delays beyond Jun 9 | Medium | TestFlight public link as fallback; PWA as primary submission URL regardless |
| Vertex AI Agent Engine integration issues | Medium | Cloud Run + ADK as backup deployment path (documented) |
| Persona-based routing collapses to "tone parameter" in practice | **High** | Tool-level enforcement per §4.3 (architectural, not prompt-level); verification in Phase 2 gate query #4 |
| Visual Describer / haptic feedback half-baked due to lack of accessibility expertise | Medium | Reference Lens app implementation patterns; scope to composition guidance only (not full accessibility audit) |
| No Mac available for SwiftUI development | **High** if discovered late | Phase 0 prerequisite check; fallback to Capacitor PWA wrap (lower quality, but still gets iOS submission) |
| HITL implementation gets skipped under time pressure | **High** | §5.7 makes HITL implementation testable; phase gates verify approval flow exists |
| Demo video doesn't make the persona-switching moment clear | High | Storyboard rehearsal with someone who hasn't seen the project; if they can't explain it in 30 sec, re-edit |

---

## 14. Build sequence summary

```
May 24-25 (2 days) — Phase 0: Setup verification + v3→v5 migration + Apple Developer enrollment
May 26-29 (4 days) — Phase 1: MULTI-AGENT REWIRE [critical phase]
May 30-Jun 2 (4 days) — Phase 2: Persona routing + Mentor Copilot
Jun 3-6 (4 days) — Phase 3: iPhone Field Coach + Triage + TestFlight submit
Jun 6-8 (3 days) — Phase 4: Print Sales + Visual Describer polish
Jun 9-10 (2 days) — Phase 5: Demo polish + iOS approval + Devpost
Jun 11 — Submit (target noon PT)

Total: ~17 working days. Budget allows for ~3-5 hours/day at AI tooling velocity = ~55-85 effective build hours.
```

---

## 15. Companion document

See `/docs/mongodb-story-document.md` for the load-bearing MongoDB partner argument. Reference it from Devpost text per §11.

---

**End of master spec (v5).**
