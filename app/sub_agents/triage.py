"""Backlog Triage sub-agent."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from memory import mcp_reads as _mcp_reads  # noqa: F401
from sub_agents._common import gemini_model, load_sub_agent_prompt
from sub_agents._toolsets import triage_tool_list

triage_agent = LlmAgent(
    name="triage",
    model=gemini_model(),
    instruction=load_sub_agent_prompt("triage"),
    description="Bulk portfolio triage with HITL pending approvals.",
    tools=triage_tool_list(),
)

__all__ = ["triage_agent"]
