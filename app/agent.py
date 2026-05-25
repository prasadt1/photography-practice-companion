"""
v5 Practice Companion orchestrator (app/agent.py).

Persona-filtered AgentTool delegation per §4.3. Playground / Agent Engine entry via
orchestrator/agent.py importing build_orchestrator_agent().
"""

from __future__ import annotations

import os

from google.adk.agents import Agent as LlmAgent
from google.adk.tools import AgentTool, FunctionTool
from google.adk.models import Gemini
from google.genai import types

from sub_agents._common import load_prompt, gemini_model
from sub_agents.coach import coach_agent
from sub_agents.field_coach import build_field_coach_agent
from sub_agents.mentor import mentor_agent
from sub_agents.planner import planner_agent
from sub_agents.print_sales import print_sales_agent
from sub_agents.reflection import reflection_agent
from sub_agents.triage import triage_agent
from sub_agents.visual_describer import visual_describer_agent
from sub_agents.tools.session_tools import (
    get_active_assignment,
    get_session_context,
    get_user_persona,
)


def build_persona_filtered_tool_list(persona: str) -> list:
    """Tool list per persona (§4.3). Forbidden sub-agents are omitted entirely."""
    field_agent = build_field_coach_agent(persona)
    # skip_summarization avoids an extra orchestrator LLM pass after each sub-agent (faster chat)
    tools: list = [
        AgentTool(agent=coach_agent, skip_summarization=True),
        AgentTool(agent=mentor_agent, skip_summarization=True),
        AgentTool(agent=planner_agent, skip_summarization=True),
        AgentTool(agent=reflection_agent, skip_summarization=True),
        AgentTool(agent=field_agent, skip_summarization=True),
        FunctionTool(get_user_persona),
        FunctionTool(get_session_context),
        FunctionTool(get_active_assignment),
    ]
    if persona in ("hobbyist", "working_pro"):
        tools.append(AgentTool(agent=triage_agent, skip_summarization=True))
    if persona == "working_pro":
        tools.append(AgentTool(agent=print_sales_agent, skip_summarization=True))
    if persona == "vision_impairment":
        tools.append(AgentTool(agent=visual_describer_agent, skip_summarization=True))
    return tools


def build_orchestrator_agent(persona: str | None = None) -> LlmAgent:
    """Create orchestrator LlmAgent with persona-scoped sub-agent tools."""
    p = persona or os.getenv("DEFAULT_PERSONA", "hobbyist")
    return LlmAgent(
        name="orchestrator",
        model=gemini_model(),
        instruction=load_prompt("orchestrator"),
        description="Routes user intent to persona-filtered sub-agents.",
        tools=build_persona_filtered_tool_list(p),
    )


# Default playground / deploy root (hobbyist unless DEFAULT_PERSONA set)
orchestrator_agent = build_orchestrator_agent()
root_agent = orchestrator_agent

__all__ = [
    "build_persona_filtered_tool_list",
    "build_orchestrator_agent",
    "orchestrator_agent",
    "root_agent",
]
