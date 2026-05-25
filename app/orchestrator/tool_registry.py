"""Legacy FunctionTool registry (pre–Phase 1). Superseded by app/agent.py AgentTool orchestrator.

Kept for reference; playground uses orchestrator/agent.py → build_orchestrator_agent().
"""

from __future__ import annotations

import logging
from typing import Any

from google.adk.tools import FunctionTool

from orchestrator.memory_tools import (
    get_active_practice_assignment,
    get_aesthetic_profile_summary,
    get_recent_portfolio,
    list_practice_assignments,
    search_glass_box_feedback,
)
from orchestrator.mongodb_mcp import load_mongodb_mcp_toolset
from orchestrator.planner_tools import suggest_practice_assignment
from orchestrator.principles_tool import search_photography_principles
from orchestrator.tools import analyze_uploaded_photo

logger = logging.getLogger(__name__)


def build_orchestrator_tools() -> list[Any]:
    """Function tools + optional MongoDB MCP toolset."""
    tools: list[Any] = [
        FunctionTool(analyze_uploaded_photo),
        FunctionTool(search_photography_principles),
        FunctionTool(get_recent_portfolio),
        FunctionTool(get_active_practice_assignment),
        FunctionTool(list_practice_assignments),
        FunctionTool(get_aesthetic_profile_summary),
        FunctionTool(search_glass_box_feedback),
        FunctionTool(suggest_practice_assignment),
    ]

    mcp = load_mongodb_mcp_toolset()
    if mcp:
        tools.append(mcp)
        logger.info("MongoDB MCP toolset registered for orchestrator")
    else:
        logger.info("MongoDB MCP skipped — using PyMongo FunctionTools only")

    return tools
