"""
Runtime verification: orchestrator's persona-filtered toolset MUST match spec §3.2.

Run: cd app && python -m pytest ../tests/test_persona_isolation.py -v
"""

from __future__ import annotations

from google.adk.tools import AgentTool

from agent import build_persona_filtered_tool_list


def _agent_names(tools: list) -> set[str]:
    names: set[str] = set()
    for t in tools:
        if isinstance(t, AgentTool):
            names.add(t.agent.name)
    return names


def test_hobbyist_isolation() -> None:
    names = _agent_names(build_persona_filtered_tool_list("hobbyist"))
    for required in ("coach", "mentor", "planner", "reflection", "triage", "field_coach"):
        assert required in names, f"FAIL: hobbyist missing required agent: {required}"
    for forbidden in ("print_sales", "visual_describer"):
        assert forbidden not in names, f"FAIL: hobbyist has forbidden agent: {forbidden}"


def test_working_pro_isolation() -> None:
    names = _agent_names(build_persona_filtered_tool_list("working_pro"))
    for required in (
        "coach",
        "mentor",
        "planner",
        "reflection",
        "triage",
        "field_coach",
        "print_sales",
    ):
        assert required in names, f"FAIL: working_pro missing required agent: {required}"
    for forbidden in ("visual_describer",):
        assert forbidden not in names, f"FAIL: working_pro has forbidden agent: {forbidden}"


def test_vision_impairment_isolation() -> None:
    names = _agent_names(build_persona_filtered_tool_list("vision_impairment"))
    for required in (
        "coach",
        "mentor",
        "planner",
        "reflection",
        "field_coach",
        "visual_describer",
    ):
        assert required in names, f"FAIL: vision_impairment missing required agent: {required}"
    for forbidden in ("print_sales", "triage"):
        assert forbidden not in names, f"FAIL: vision_impairment has forbidden agent: {forbidden}"


def test_all_personas_have_orchestrator_base() -> None:
    for persona in ("hobbyist", "working_pro", "vision_impairment"):
        names = _agent_names(build_persona_filtered_tool_list(persona))
        for base in ("coach", "mentor", "planner", "reflection", "field_coach"):
            assert base in names, f"FAIL: {persona} missing base agent: {base}"
