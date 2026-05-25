"""Planner sub-agent (v5)."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from memory import mcp_reads as _mcp_reads  # noqa: F401
from sub_agents._common import gemini_model, load_sub_agent_prompt
from sub_agents._toolsets import planner_tool_list
from sub_agents.planner_pipeline import generate_assignment

planner_agent = LlmAgent(
    name="planner",
    model=gemini_model(),
    instruction=load_sub_agent_prompt("planner"),
    description="Generates persona-aware practice assignments with HITL propose flow.",
    tools=planner_tool_list(),
)

__all__ = ["planner_agent", "generate_assignment"]
