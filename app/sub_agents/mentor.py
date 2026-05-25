"""Mentor Copilot sub-agent (v5)."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from memory import mcp_reads as _mcp_reads  # noqa: F401
from sub_agents._common import gemini_model, load_prompt
from sub_agents._toolsets import mentor_tool_list

mentor_agent = LlmAgent(
    name="mentor",
    model=gemini_model(),
    instruction=load_prompt("mentor"),
    description="Multi-turn mentor; portfolio search and aesthetic synthesis.",
    tools=mentor_tool_list(),
)

__all__ = ["mentor_agent"]
