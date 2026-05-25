"""Coach sub-agent (v5)."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from sub_agents._common import gemini_model, load_prompt
from sub_agents._toolsets import coach_tool_list
from sub_agents.coach_pipeline import analyze_photo

coach_agent = LlmAgent(
    name="coach",
    model=gemini_model(),
    instruction=load_prompt("coach"),
    description="Multimodal photo critique, Glass Box reasoning, portfolio writes.",
    tools=coach_tool_list(),
)

__all__ = ["coach_agent", "analyze_photo"]
