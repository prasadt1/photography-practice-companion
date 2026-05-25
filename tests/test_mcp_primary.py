"""Consolidation item 3 — MongoDB reads route through mcp_reads when MCP-primary."""

from __future__ import annotations

import inspect


def test_mentor_tools_use_mcp_reads():
    from sub_agents.tools import mentor_tools
    from orchestrator import memory_tools

    vec_src = inspect.getsource(mentor_tools.vector_search_similar_photos)
    assert "mcp_reads" in vec_src

    atlas_src = inspect.getsource(mentor_tools.atlas_search_glass_box)
    search_src = inspect.getsource(memory_tools.search_glass_box_feedback)
    assert "mcp_reads" in search_src or "mcp_reads" in atlas_src


def test_orchestrator_memory_tools_use_mcp_reads():
    from orchestrator import memory_tools

    src = inspect.getsource(memory_tools.search_glass_box_feedback)
    assert "mcp_reads" in src


def test_sub_agents_import_mcp_reads_module():
    import sub_agents.coach as coach_mod
    import sub_agents.triage as triage_mod

    assert hasattr(coach_mod, "_mcp_reads")
    assert hasattr(triage_mod, "_mcp_reads")
