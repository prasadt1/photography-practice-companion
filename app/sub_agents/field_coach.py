"""Field Coach — sub-orchestrator for iPhone capture."""

from __future__ import annotations

import os

from google.adk.agents import Agent as LlmAgent

from sub_agents._common import gemini_model, load_prompt
from sub_agents._toolsets import field_coach_tool_list


def build_field_coach_agent(persona: str | None = None) -> LlmAgent:
    p = persona or os.getenv("DEFAULT_PERSONA", "hobbyist")
    return LlmAgent(
        name="field_coach",
        model=gemini_model(),
        instruction=load_prompt("field_coach"),
        description="Field session orchestration; delegates to Coach/Mentor/Visual Describer.",
        tools=field_coach_tool_list(p),
    )


field_coach_agent = build_field_coach_agent()

__all__ = ["field_coach_agent", "build_field_coach_agent"]
