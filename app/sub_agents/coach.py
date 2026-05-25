"""Coach sub-agent (v5)."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from memory import mcp_reads as _mcp_reads  # noqa: F401 — MCP-primary reads when enabled
from sub_agents._common import gemini_model, load_sub_agent_prompt
from sub_agents._toolsets import coach_tool_list
from sub_agents.coach_pipeline import analyze_photo

coach_agent = LlmAgent(
    name="coach",
    model=gemini_model(),
    instruction=load_sub_agent_prompt("coach"),
    description="Multimodal photo critique, Glass Box reasoning, portfolio writes.",
    tools=coach_tool_list(),
)

__all__ = ["coach_agent", "analyze_photo"]
