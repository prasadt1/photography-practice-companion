"""Print Sales Strategist (working_pro only at orchestrator level)."""

from __future__ import annotations

from google.adk.agents import Agent as LlmAgent

from sub_agents._common import gemini_model, load_prompt
from sub_agents._toolsets import print_sales_tool_list

print_sales_agent = LlmAgent(
    name="print_sales",
    model=gemini_model(),
    instruction=load_prompt("print_sales"),
    description="Marketplace listing strategy and HITL publication proposals.",
    tools=print_sales_tool_list(),
)

__all__ = ["print_sales_agent"]
