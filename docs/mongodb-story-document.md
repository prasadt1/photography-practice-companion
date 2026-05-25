# Iris (Practice Companion) — MongoDB as Memory Substrate

*Standalone document for Devpost text, judge pitch, README architecture section, and any place where the partner load-bearing argument needs to live coherently. Built to be quoted from, not summarized. Public product name: **Iris**; technical repo/database identifiers remain Practice Companion.*

---

## The thesis

Practice Companion's product premise — *an AI mentor that adapts to who you are and remembers what you've made* — requires a memory substrate that's simultaneously multimodal, reactively coherent across channels, queryable in multiple modes, and operationally simple. MongoDB Atlas provides this combination in one managed service. The alternative architectures (Postgres + pgvector + Elasticsearch + Redis, or Firestore with its own constraints) are achievable but impose operational complexity for identical product outcome.

For a multi-channel, multi-persona AI product where the data primitive is "the creator's evolving identity over time," Atlas's combination of multimodal vector search, flexible documents, full-text search, change streams, and per-tenant isolation is the cleanest operational fit. The MongoDB MCP Server then exposes these primitives as agent-native tools, which makes the orchestrator architecture clean rather than fragmented.

---

## The product's data primitive

A photographer's identity over time is not a row in a table. It's a layered, evolving object made of:

- **Captured work** — every photo with its scene, technical metadata, multimodal embedding, Coach analysis, and spatial annotations
- **Critique history** — every Glass Box analysis, every observation, every grounding citation, every priority fix
- **Practice journey** — every assignment proposed, accepted, completed, abandoned; baseline vs completion deltas
- **Conversational memory** — every Mentor session, multi-turn threads, what was asked and answered
- **Aesthetic profile** — derived state about dominant tones, preferred lighting, subject patterns, stylistic evolution
- **Persona-specific data** — for working pros: client outcomes, conversion patterns, print sales; for photographers with vision impairment: scene descriptions, capture intents, haptic patterns

This data is multimodal (images + text + numeric scores + spatial metadata), evolves over time (today's aesthetic profile is different from last month's), is queried in different modes (visual similarity, text search, structured aggregation), and must be reactively coherent across channels (mobile capture, web review, future desktop curation).

This shape isn't relational. It isn't pure key-value. It isn't analytical. It's *creator identity over time*, and document-shaped storage with multimodal vector search and reactive update is the natural fit.

---

## MongoDB primitives × Practice Companion features

Every agentic feature in Practice Companion uses MongoDB primitives in concert. The combination is what makes the architecture cohesive.

| Feature | MongoDB primitives in critical path | Why this specific combination |
|---|---|---|
| **Mentor Copilot** (chat orchestrator) | Cross-collection aggregation + Atlas Search + Vector Search + Conversation state | Multi-turn queries join portfolio + practice + conversations + profile. Dual search modes: text for "what feedback did I get about portraits last month" / vector for "show me photos similar to this one." Conversation history threads across sessions. |
| **Live Field Coach** (iPhone, real-time) | Low-latency writes + multimodal vector search + Session state document | Real-time capture flow: photo → embedding → write to portfolio → query for aesthetic similarity ("have I shot this before?") + aesthetic_profile lookup ("what would I usually do here?") + current session state ("what have I already advised this shoot?") |
| **Backlog Triage Agent** | Bulk operations + vector clustering + Atlas Search + Change streams | Process thousands of untagged photos: vector clustering to surface duplicates and similar work, Atlas Search to find specific moments, bulk tag writes from human corrections, change streams reactively update aesthetic_profile |
| **Print Sales Strategist** (working pro mode) | Aggregation pipelines + vector similarity + flexible schema | Cross-references portfolio against historical sales data. Vector finds "photos similar to my top-converting prints." Aggregation computes ROI per photo type per marketplace. Flexible schema accommodates per-marketplace listing structures without schema migration. |
| **Visual Describer Agent** (low-vision mode) | Flexible schema for multimodal interaction history + Atlas Search + Vector Search | Capture sessions stored with scene descriptions, voice transcripts, haptic patterns alongside the visual embedding. Atlas Search enables natural-language recall in the modality the user can hear ("what did I shoot today with the bench?") |

Every feature uses 3+ primitives. None could be replaced with "just key-value storage" or "just vector search." That's the architectural argument.

---

## MongoDB primitives × persona

The three personas access the memory layer with structurally different query patterns. The persona-based agentic routing in the orchestrator means each persona exercises different MongoDB primitives.

### Hobbyist persona

Primary collections: `portfolio_entries`, `practice_assignments`, `aesthetic_profile`, `conversations`

Distinctive query patterns:
- **Aesthetic similarity over time** — "show me how my portrait work has evolved" (vector search with date filtering)
- **Critique recall** — "what did Coach say about my lighting last month" (Atlas Search on `glass_box.observations`)
- **Practice continuity** — "what's the next thing I should work on" (aggregation across portfolio scores + active assignments + profile gaps)
- **Aesthetic profile evolution** — change streams recompute the profile as new portfolio entries arrive

The data shape rewards MongoDB's combination because the queries blend visual, textual, and structured data in single requests.

### Working pro persona

All hobbyist collections + `client_outcomes`, `print_sales`, `shoot_metadata`, `client_preferences`

Distinctive query patterns:
- **Conversion correlation** — "which aesthetics of my portfolio converted to print sales" (aggregation joining `portfolio_entries` with `print_sales`)
- **Client preference matching** — "is this shot in the aesthetic that converts well for [client_id]" (vector similarity over `client_preferences` per-tenant)
- **Business-aware planning** — Planner agent queries `shoot_metadata` for upcoming bookings, generates assignments aligned to revenue-generating skills
- **ROI per print type** — aggregations across `print_sales` by marketplace, format, and aesthetic cluster

The flexible schema is critical here. Different marketplaces have different listing structures (Etsy ≠ Saatchi Art ≠ Society6). Per-marketplace metadata fields evolve over time. Schema migration would be operationally expensive in a relational system; MongoDB's document model absorbs the variance.

### Photographer with vision impairment persona

Primary collections: `portfolio_entries` (with enriched `scene_description`, `capture_intent`, `audio_transcript` fields), `capture_sessions`, `haptic_patterns`

Distinctive query patterns:
- **Auditory recall** — "what did I shoot today?" → Atlas Search over `scene_description` and `audio_transcript`, output as narrated speech
- **Spatial confirmation** — Field Coach queries `capture_sessions` for what's been described already in this shoot, to avoid repetition
- **Capture intent matching** — "did I capture what I was trying to capture?" → vector similarity between current frame and the user's stated intent earlier in the session
- **Cross-session continuity** — "have I been to this place before?" → Atlas Search on `scene_description` from prior `capture_sessions`

The flexible schema is again critical. This persona's collections have additional fields that other personas' collections don't have. MongoDB's per-collection-but-multiple-schemas model accommodates this without schema fragmentation across users.

---

## Cross-channel user journeys — MongoDB as connective tissue

The strongest part of the MongoDB argument lives in cross-channel coherence. The same `portfolio_entries` document, written from one surface, is read and updated from another, with reactive updates propagating through change streams. There's no "your iPhone version vs your web version" of your aesthetic identity — there's one identity, three access surfaces, MongoDB as the unified state.

### Journey 1: Hobbyist multi-channel learning loop

> **Sunday evening, web.** Photographer uploads recent portrait shoot. Coach analyzes via Gemini 3 Pro grounded in Agent Builder Data Store principles, writes structured analysis to `portfolio_entries` with multimodal embedding. Mentor Copilot suggests practice on backlit subjects. Planner sub-agent writes new `practice_assignments` document, status `active`.
>
> **Monday morning, iPhone Field Mode.** Photographer is shooting outdoors. Field Coach queries MongoDB on session start for `active` assignments — finds the backlit subjects assignment. Detects backlit portrait setup, voices "this is a good moment for that backlit subjects assignment from Sunday."
>
> **Tuesday evening, web.** Photographer reviews iPhone captures in Memory tab. Reflection sub-agent compares baseline shoots to new ones (vector similarity + score aggregation), computes ISAR delta, updates the `practice_assignments` document with `skill_delta`. Change stream notifies the iPhone of the update — next time Field Coach launches, it sees the assignment as `completed`.

**MongoDB's role:** Same `practice_assignments` document. Written by web Sunday, read by iPhone Monday, updated by web Tuesday. No sync layer. No polling. Change streams broadcast updates to whatever channel is listening. The product experience of "continuity across devices" is structurally enabled by the operational substrate.

### Journey 2: Working pro business-aware workflow

> **Saturday, iPhone.** Wedding shoot. Field Coach in working-pro mode queries `client_preferences` document for this couple (saved from intake call), references their documented aesthetic preferences from earlier in MongoDB. Prompts photographer when a shot matches their style — also queries `client_outcomes` to recall what worked for similar couples in prior shoots.
>
> **Sunday, web.** Photographer culls in Lightroom. XMP sidecars flow into Practice Companion via the integration; `portfolio_entries` updated with star ratings, color labels, keywords. Backlog Triage Agent surfaces 6 photos that are vector-similar to top-converting prints from the past year. Photographer adds them to a separate `print_candidates` collection.
>
> **Monday, iPhone on commute.** Photographer asks Mentor Copilot: "Of yesterday's shoot, which are good Society6 print candidates?" Print Sales Strategist agent queries the new `print_candidates` collection + historical Society6 `print_sales` data + per-print performance, returns ranked recommendations with draft listings.

**MongoDB's role:** Five collections (`portfolio_entries`, `client_preferences`, `client_outcomes`, `print_candidates`, `print_sales`) queried across three channels in one continuous product experience. The flexible document schema accommodates per-marketplace listing data without schema migration. Aggregation pipelines correlate visual aesthetics with commercial outcomes.

### Journey 3: Photographer with vision impairment capture-and-recall

> **Afternoon, iPhone in low-vision mode.** Photographer at Palmengarten in Frankfurt. Visual Describer agent narrates the scene through earbuds: "There's a wooden bench in the upper left of your frame, about two meters away, with a tree behind it. The light is warm on the bench from the right side." User says "I want to center the bench." Haptic feedback engages — taps get faster as the bench moves toward center, confirmation pulse when centered. Capture taken; `portfolio_entries` document stores image + embedding + `scene_description` ("wooden bench, centered, warm right-side light, tree backdrop") + `capture_intent` ("center the bench") + `haptic_pattern_used`.
>
> **Evening, web (or iPhone with screen reader).** Photographer says to Mentor Copilot: "Tell me what I shot at the Palmengarten today." Agent uses Atlas Search over `scene_description` filtered to today and that location, retrieves three captures. Narrates them in sequence with embellishment: "Your first capture is the wooden bench you centered, with warm afternoon light. The composition you intended worked — the bench is at the visual center of the frame."
>
> **Two weeks later, photographer asks:** "Have I been to a place like this before?" Atlas Search across all prior `capture_sessions` for similar scene descriptions. Returns: "Yes, you captured something similar at the Senckenberg gardens in October — also a bench, also warm light, but with different framing."

**MongoDB's role:** Atlas Search (not vector search) is the primary retrieval mode for this persona. Vector search is still used (for "similar photos by embedding") but the user's primary recall mode is auditory and text-based. The flexible schema means this persona's collection has additional fields (`scene_description`, `capture_intent`, `haptic_pattern_used`, `audio_transcript`) that other personas' collections don't need. No fragmentation; same database; persona-specific enrichment.

---

## The continuity narrative

The persistent thread across all channels and personas: *the photographer's mentor remembers them.* Every interaction reads from and writes to the same MongoDB memory layer. The mentor that critiqued your portrait Sunday on the web is the same mentor that nudges you during the shoot on Monday and reflects on your work Tuesday. There's no "your iPhone version" vs "your web version" of your aesthetic identity. There's one identity, three access surfaces.

This continuity is the structural differentiator from one-shot AI critique tools. Every other AI photography app starts each session fresh, treats each upload as isolated, and forgets immediately. Practice Companion remembers — and the remembering is built into the data substrate, not bolted on as a feature.

For the working pro, this becomes: "the mentor that helps me deliver this wedding gallery is the same mentor that learned my client's aesthetic from the last three weddings I delivered." For the photographer with vision impairment, it becomes: "the mentor that described today's park scene is the same mentor that recalls last week's botanical garden shoot in language I can hear."

The product narrative is enabled by the data architecture. Without MongoDB Atlas's specific combination of primitives, the cross-channel continuity story would require multiple sync systems and accept eventual consistency issues that break the product experience.

---

## Honest competitive framing

The strongest version of this story doesn't claim MongoDB is uniquely necessary. It claims MongoDB is the *cleanest operational fit* for this data shape among available infrastructure. That's defensible to a sophisticated judge in a way that "MongoDB is the only choice" is not.

**What MongoDB Atlas does well for Practice Companion specifically:**

1. **Multimodal vector search co-located with flexible documents** — embeddings live in the same document as the structured Coach analysis, the spatial annotations, the conversation references. No JOIN across systems.

2. **Atlas Search as a first-class citizen** — full-text retrieval over Glass Box content, scene descriptions, conversation history without setting up a separate Elasticsearch cluster.

3. **Change streams without separate event infrastructure** — `aesthetic_profile` derivation, cross-device notifications, reactive UI updates all flow from change streams on `portfolio_entries`. No Kafka, no Redis pub-sub, no application-level polling.

4. **Per-tenant isolation through document structure** — photographer data is isolated through document ownership patterns rather than database-level multi-tenancy gymnastics. MCP Server access controls map cleanly.

5. **MongoDB MCP Server as agent-native interface** — the orchestrator queries the memory layer through MCP, abstracting MongoDB operations behind LLM-friendly tool descriptions. This is the partner integration the hackathon explicitly looks for.

**Where alternatives would also work, with tradeoffs:**

- **Firestore (Google's own document database)** — closest equivalent. Has documents + vectors + change listeners + per-tenant rules. *Tradeoffs:* query model is more limited (no cross-collection joins in single queries, weaker aggregation), security rules can get complex across personas, and Firestore is the host platform — using it would mean no partner track at all, which doesn't fit the hackathon structure.

- **Postgres + pgvector + Elasticsearch + Redis + custom event service** — achievable. Five systems instead of one. Sync issues across them. Photographer's identity scattered across multiple stores. Operational complexity grows linearly with new features. For a product where the data primitive is "creator identity over time," this fragmentation works *against* the product experience.

- **AlloyDB with pgvector** — Postgres-compatible with vectors. Good for structured + vector workloads. Less natural for the document-shaped data (Glass Box, scene descriptions, evolving per-persona fields). Schema migration cost grows with new persona-specific fields.

- **BigQuery with vector search** — analytical, not transactional. Wrong shape for real-time product reads. Good as an analytics destination but not the operational store.

**The honest pitch:** MongoDB Atlas's specific combination of primitives in one managed service is the cleanest operational fit for this multi-persona, multi-channel data shape. The MongoDB MCP Server provides agent-native access. Alternatives are possible but would impose operational complexity for the same product outcome.

That framing is defensible to:
- A MongoDB judge — because it's a clear partner-load-bearing argument
- A Google judge — because it acknowledges Firestore could do most of this and explains the operational fit reasoning
- A neutral engineering judge — because it's honest about tradeoffs rather than salesman framing

---

## The expansion narrative

The architectural pattern — "AI mentor with persistent identity-aware memory in one managed multi-primitive store" — generalizes well beyond photography. Same MongoDB-shaped substrate works for:

- **Illustrators** — portfolio + style consistency + commission tracking
- **Video creators** — clip library + voice/editing patterns + audience analytics
- **Musicians** — compositions + style evolution + collaboration patterns
- **Writers** — drafts + rhetorical fingerprints + publication history
- **Designers** — projects + aesthetic identity + client outcomes

Same multimodal embeddings model (text, image, audio, video), same flexible schema for creator-specific metadata, same change streams for reactive identity updates, same Atlas Search for natural-language recall. The photography submission proves the pattern; MongoDB's creator-economy vertical adoption is the expansion play.

---

## Devpost-ready talking points

For the submission text, demo video, and judge interactions, the load-bearing claims to make about MongoDB:

1. **MongoDB Atlas is the memory substrate that makes Practice Companion's premise possible.** "An AI mentor that remembers who you are as a photographer" requires per-tenant memory with multimodal vector search, document flexibility, full-text retrieval, and reactive change streams — all in one operational primitive.

2. **The MongoDB MCP Server is the orchestrator's primary data interface.** Every read about portfolios, practice assignments, aesthetic profiles, and conversation history flows through the MCP Server. This is the partner integration as the agent's data superpower.

3. **Three personas exercise three different access patterns over the same memory.** Hobbyists query for aesthetic evolution. Working pros query for business correlation. Photographers with vision impairment query for auditory recall. Same database, three structurally different patterns, no schema fragmentation.

4. **Cross-channel coherence is structurally built in, not application-level engineered.** Same `portfolio_entries` document updated by web upload, read by iPhone Field Coach, modified by Reflection. Change streams propagate state. There's no sync layer because there doesn't need to be one.

5. **The architectural pattern generalizes across the creator economy.** Illustrators, video creators, musicians, writers — same MongoDB-shaped substrate, different multimodal embeddings. The photography submission demonstrates the pattern; MongoDB's vertical expansion is the commercial argument.

These five points are designed to be quotable directly into the Devpost text without modification.
