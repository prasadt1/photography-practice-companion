#!/usr/bin/env python3
"""Dump the live ADK agent graph — proof that the 9 agents exist and are wired.

Imports the real orchestrator from app/agent.py (the same entry the Playground and
Agent Engine use) and enumerates, per persona:
  - the root orchestrator LlmAgent + its model
  - every sub-agent reached via AgentTool, with each sub-agent's own tools
  - the persona-filtered delegation (which sub-agents each persona can reach)

Writes structured + human-readable evidence under docs/compliance-proof/evidence/:
  - agent-graph.json
  - agent-graph.txt

This is code-level proof (not a hand-drawn diagram): the names come straight from
the constructed ADK graph. build-compliance-proof-images.py renders proof-05 from
agent-graph.json.

Run:
  cd app && uv run python ../scripts/dump-agent-graph.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
EVIDENCE = ROOT / "docs" / "compliance-proof" / "evidence"

sys.path.insert(0, str(APP))

PERSONAS = ["hobbyist", "working_pro", "vision_impairment"]


def _tool_entry(tool: object) -> dict:
    """Classify an ADK tool as a delegated agent or a function tool."""
    agent = getattr(tool, "agent", None)
    if agent is not None:
        return {
            "kind": "agent",
            "name": getattr(agent, "name", repr(agent)),
            "tools": [_tool_entry(t) for t in (getattr(agent, "tools", None) or [])],
        }
    name = getattr(tool, "name", None)
    if not name:
        func = getattr(tool, "func", None)
        name = getattr(func, "__name__", None) or type(tool).__name__
    return {"kind": "function", "name": name}


def _model_name(agent: object) -> str:
    model = getattr(agent, "model", None)
    if model is None:
        return "(unset)"
    return getattr(model, "model", None) or str(model)


def main() -> None:
    from agent import build_orchestrator_agent, build_persona_filtered_tool_list

    per_persona: dict[str, dict] = {}
    sub_agents: dict[str, dict] = {}

    for persona in PERSONAS:
        orchestrator = build_orchestrator_agent(persona)
        tool_list = build_persona_filtered_tool_list(persona)

        delegated: list[str] = []
        function_tools: list[str] = []
        for tool in tool_list:
            entry = _tool_entry(tool)
            if entry["kind"] == "agent":
                delegated.append(entry["name"])
                # Record each distinct sub-agent's own tool surface once.
                agent = getattr(tool, "agent")
                if entry["name"] not in sub_agents:
                    sub_agents[entry["name"]] = {
                        "name": entry["name"],
                        "model": _model_name(agent),
                        "description": getattr(agent, "description", "") or "",
                        "tools": [t for t in entry["tools"]],
                    }
            else:
                function_tools.append(entry["name"])

        per_persona[persona] = {
            "orchestrator": orchestrator.name,
            "orchestrator_model": _model_name(orchestrator),
            "delegated_agents": delegated,
            "orchestrator_function_tools": function_tools,
        }

    # The full agent roster = orchestrator + every distinct sub-agent reached
    # across personas.
    roster = ["orchestrator", *sorted(sub_agents)]

    graph = {
        "framework": "Google ADK (google.adk.agents.Agent / AgentTool)",
        "entrypoint": "app/agent.py:build_orchestrator_agent",
        "agent_count": len(roster),
        "roster": roster,
        "orchestrator_model": per_persona[PERSONAS[0]]["orchestrator_model"],
        "sub_agents": sub_agents,
        "personas": per_persona,
    }

    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / "agent-graph.json").write_text(
        json.dumps(graph, indent=2), encoding="utf-8"
    )

    # Human-readable summary
    lines: list[str] = []
    lines.append(f"ADK agent graph — {graph['agent_count']} agents")
    lines.append(f"Framework: {graph['framework']}")
    lines.append(f"Entrypoint: {graph['entrypoint']}")
    lines.append(f"Orchestrator model: {graph['orchestrator_model']}")
    lines.append("")
    lines.append("Roster:")
    for name in roster:
        if name == "orchestrator":
            lines.append(f"  - orchestrator (root LlmAgent) — delegates via AgentTool")
        else:
            sa = sub_agents[name]
            n_tools = len(sa["tools"])
            lines.append(f"  - {name} · {n_tools} tools — {sa['description']}")
    lines.append("")
    lines.append("Persona-filtered delegation (forbidden sub-agents omitted):")
    for persona, info in per_persona.items():
        lines.append(f"  {persona}: {', '.join(info['delegated_agents'])}")
    lines.append("")
    lines.append("Per-agent tools:")
    for name in sorted(sub_agents):
        sa = sub_agents[name]
        tnames = [t["name"] + ("()" if t["kind"] == "agent" else "") for t in sa["tools"]]
        lines.append(f"  {name}: {', '.join(tnames)}")

    summary = "\n".join(lines)
    (EVIDENCE / "agent-graph.txt").write_text(summary + "\n", encoding="utf-8")

    print(summary)
    print()
    print(f"Wrote {EVIDENCE / 'agent-graph.json'}")
    print(f"Wrote {EVIDENCE / 'agent-graph.txt'}")


if __name__ == "__main__":
    main()
