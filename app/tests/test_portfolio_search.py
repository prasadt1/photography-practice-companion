"""Portfolio library search — Gemini query expansion + Atlas/keyword search."""

import re
from unittest.mock import patch

from orchestrator.memory_tools import (
    _portfolio_text_search_filter,
    _regex_for_term,
    search_glass_box_feedback,
)


def test_regex_car_does_not_match_cardboard() -> None:
    pattern = _regex_for_term("car")
    assert re.search(pattern, "gold scalloped cardboard base", re.I) is None
    assert re.search(pattern, "a car on the road", re.I) is not None


def test_portfolio_text_search_includes_scene_and_tags() -> None:
    filt = _portfolio_text_search_filter(["animal", "lion"], {"user_id": "abc"})
    fields = {next(iter(clause.keys())) for clause in filt["$or"]}
    assert "aesthetic_tags" in fields
    assert "scene_description" in fields


def test_portfolio_text_search_lion_term_matches_scene() -> None:
    filt = _portfolio_text_search_filter(["lion"], {})
    pattern = next(
        clause["scene_description"]["$regex"]
        for clause in filt["$or"]
        if "scene_description" in clause
    )
    scene = "A full-body portrait of a male lion standing in tall, dry grass"
    assert re.search(pattern, scene, re.I) is not None


@patch("memory.assignments._resolve_user_id")
@patch("orchestrator.memory_tools._atlas_text_search")
@patch("tools.search_query.expand_library_search_terms")
def test_search_glass_box_feedback_uses_expanded_terms(
    mock_expand,
    mock_atlas,
    mock_uid,
) -> None:
    mock_uid.return_value = "6577a1f2b3c4d5e6f7a8b9c0"
    mock_expand.return_value = ("tiger", "lion", "wildlife", "big cat")
    mock_atlas.return_value = (
        [{"id": "lion-shot", "sceneDescription": "male lion in savanna"}],
        "regex_fallback",
    )

    out = search_glass_box_feedback("tiger", limit=5)

    assert out["query"] == "tiger"
    assert "lion" in out["searchTerms"]
    mock_expand.assert_called_once_with("tiger")
    mock_atlas.assert_called_once()
    assert mock_atlas.call_args.args[0] == ["tiger", "lion", "wildlife", "big cat"]
    assert out["matches"][0]["id"] == "lion-shot"
