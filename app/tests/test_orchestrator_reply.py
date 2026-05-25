"""Unit tests for Mentor chat reply extraction from ADK events."""

from types import SimpleNamespace

from api.orchestrator_service import (
    _collect_reply_from_events,
    _format_agent_result_payload,
    _text_from_sub_agent_function_response,
)


def test_format_planner_json_brief() -> None:
    raw = '{"brief": "Shoot reflections.", "rationale": "You like soft light."}'
    out = _format_agent_result_payload(raw)
    assert "Shoot reflections." in out
    assert "soft light" in out


def test_sub_agent_function_response_mentor_prose() -> None:
    fr = SimpleNamespace(
        name="mentor",
        response={"result": "Your lighting is improving."},
    )
    assert _text_from_sub_agent_function_response(fr) == "Your lighting is improving."


def test_collect_prefers_sub_agent_over_empty_direct() -> None:
    fr_part = SimpleNamespace(
        text=None,
        thought=False,
        function_response=SimpleNamespace(
            name="planner",
            response={"result": "Practice framing today."},
        ),
    )
    event = SimpleNamespace(content=SimpleNamespace(parts=[fr_part]))
    assert _collect_reply_from_events([event]) == "Practice framing today."


def test_collect_direct_text_when_no_sub_agent() -> None:
    part = SimpleNamespace(text="Hello!", thought=False, function_response=None)
    event = SimpleNamespace(content=SimpleNamespace(parts=[part]))
    assert _collect_reply_from_events([event]) == "Hello!"
