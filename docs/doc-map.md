# Documentation map

**Master spec (canonical):** [`spec.md`](spec.md) — schema, phases, agents, rules, demo.

Child docs **elaborate** spec sections; on conflict, **spec.md wins**. Update spec first, then sync children.

| Document | Owns | Spec sections |
|----------|------|----------------|
| [`spec.md`](spec.md) | Requirements, schema, phases, appendices | All |
| [`architecture.md`](architecture.md) | Components, data flows, security, integrations | §2, §7, §10, §11 |
| [`implementation-plan.md`](implementation-plan.md) | Phase tasks, gates, estimates, risks | Phase 0–4, Appendix A |
| [`phase1-gate.md`](phase1-gate.md) | Phase 1 verification checklist + `make verify-phase1` | Phase 1 gate only |
| [`infrastructure-deployment.md`](infrastructure-deployment.md) | GCP/Atlas/Firebase deploy, costs, CI/CD | §0, §11 |
| [`mongodb-setup.md`](mongodb-setup.md) | Atlas cluster, MCP env, bootstrap, IP allowlists | §0.1, §7 |
| [`atlas-indexes-setup.md`](atlas-indexes-setup.md) | Vector Search + Atlas Search UI steps | §7.3 |
| [`decisions.md`](decisions.md) | ADRs (image storage, MCP vs PyMongo, regions, Studio UI ADR-009) | — |
| [`testing-strategy.md`](testing-strategy.md) | Test pyramid, agent tests, demo QA | Phase gates |
| [`ui-ux-design.md`](ui-ux-design.md) | IA, flows, components, visual system | §3, Phase 3 UI |
| [`demo-script.md`](demo-script.md) | Timed demo script | §13, §16 |
| [`devpost-draft.md`](devpost-draft.md) | Submission copy draft | §18 |
| [`implementation-and-hackathon-mapping.md`](implementation-and-hackathon-mapping.md) | What’s built + infra/agents + rules mapping | Judges, Devpost |
| [`claude-code-handoff.md`](claude-code-handoff.md) | Doc review corrections for Claude Code | — |

## Scripts (spec-mandated)

| Script | Purpose |
|--------|---------|
| `scripts/bootstrap-mongodb.py` | Idempotent DB, collections, compound indexes |
| `scripts/seed-demo-data.py` | Demo portfolio + assignments (Phase 3) |
| `scripts/setup-dev-https.sh` | Field Mode LAN HTTPS (port from gemma4) |
