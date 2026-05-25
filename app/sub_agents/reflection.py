"""Reflection sub-agent (v5)."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from sub_agents._common import gemini_model, load_prompt
from sub_agents._toolsets import reflection_tool_list
from sub_agents.reflection_pipeline import reflect_assignment

reflection_agent = LlmAgent(
    name="reflection",
    model=gemini_model(),
    instruction=load_prompt("reflection"),
    description="ISAR-style assignment reflection and skill delta.",
    tools=reflection_tool_list(),
)

__all__ = ["reflection_agent", "reflect_assignment"]
