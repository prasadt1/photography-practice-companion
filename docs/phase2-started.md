# Phase 2 — orchestrator tools

## Playground

```bash
make playground   # port 8080 — do not conflict with make api-dev (8081)
```

## Orchestrator tools

| Tool | Purpose |
|------|---------|
| `search_photography_principles` | Agent Builder Data Store + `principles/` fallback |
| `get_recent_portfolio` | Recent critiques from MongoDB |
| `get_active_practice_assignment` | Active HITL assignment |
| `list_practice_assignments` | Proposed / active / completed |
| `get_aesthetic_profile_summary` | Tags + average scores |
| `search_glass_box_feedback` | Atlas Search (`glass_box_search`) or regex fallback |
| `suggest_practice_assignment` | Planner → proposed assignment |
| `analyze_uploaded_photo` | Coach pipeline |
| **MongoDB MCP** | Optional `McpToolset` from `mcp-config.json` (requires `npx`) |

Set `ORCHESTRATOR_USE_MCP=false` to disable MCP subprocess (FunctionTools still read MongoDB).

## Demo prompts (playground)

1. “What is my active practice assignment?”
2. “Search my feedback about composition.”
3. “Explain rule of thirds using our principles.”
4. “Summarize my recent portfolio scores.”

## Verify

```bash
make agent-import
```

Expect tool count ≥ 8.
