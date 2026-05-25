"""Visual Describer (vision_impairment at orchestrator level)."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from memory import mcp_reads as _mcp_reads  # noqa: F401
from sub_agents._common import gemini_model, load_sub_agent_prompt
from sub_agents._toolsets import visual_describer_tool_list

visual_describer_agent = LlmAgent(
    name="visual_describer",
    model=gemini_model(),
    instruction=load_sub_agent_prompt("visual_describer"),
    description="Voice-first scene description and capture-session memory.",
    tools=visual_describer_tool_list(),
)

__all__ = ["visual_describer_agent"]
