"""Orchestrator read tools — MCP-primary reads via memory.mcp_reads."""

from __future__ import annotations

import re
from typing import Any

from memory.assignments import get_active_assignment, list_assignments
from memory.portfolio import compute_aesthetic_summary, list_portfolio_entries


def get_active_practice_assignment() -> dict[str, Any]:
    """Return the user's active practice assignment, or a message if none."""
    active = get_active_assignment()
    if not active:
        return {"active": None, "message": "No active assignment. User may propose one in Practice tab."}
    return {"active": active}


def get_recent_portfolio(limit: int = 5) -> dict[str, Any]:
    """Summarize recent portfolio critiques (scores, tags, scene descriptions)."""
    limit = max(1, min(int(limit), 20))
    data = list_portfolio_entries(limit=limit)
    entries = []
    for e in data.get("entries", []):
        entries.append(
            {
                "id": e["id"],
                "createdAt": e.get("createdAt"),
                "overallAverage": e.get("overallAverage"),
                "scores": e.get("scores"),
                "aestheticTags": e.get("aestheticTags"),
                "sceneDescription": (e.get("sceneDescription") or "")[:300],
            }
        )
    return {"entries": entries, "total": data.get("total", len(entries))}


def get_aesthetic_profile_summary() -> dict[str, Any]:
    """Dominant tags and average scores from recent portfolio."""
    return compute_aesthetic_summary()


def list_practice_assignments() -> dict[str, Any]:
    """Proposed, active, and completed assignments for the demo user."""
    return list_assignments()


def _regex_for_term(term: str) -> str:
    """Whole-word match so e.g. car does not match cardboard."""
    escaped = re.escape(term.strip())
    if not escaped:
        return escaped
    return rf"\b{escaped}\b"


def _portfolio_text_search_filter(terms: list[str], match: dict[str, Any]) -> dict[str, Any]:
    """Match expanded search terms across scene, tags, and Glass Box text."""
    clauses: list[dict[str, Any]] = []
    for term in terms:
        regex = {"$regex": _regex_for_term(term), "$options": "i"}
        clauses.extend(
            [
                {"scene_description": regex},
                {"aesthetic_tags": regex},
                {"user_tags": regex},
                {"colour_notes": regex},
                {"glass_box.observations": regex},
                {"glass_box.reasoning_steps": regex},
            ]
        )
    return {**match, "$or": clauses}


def _doc_search_blob(doc: dict[str, Any]) -> str:
    gb = doc.get("glass_box") or {}
    parts = [
        doc.get("scene_description") or "",
        " ".join(doc.get("aesthetic_tags") or []),
        " ".join(doc.get("user_tags") or []),
        doc.get("colour_notes") or "",
        " ".join(gb.get("observations") or []),
        " ".join(gb.get("reasoning_steps") or []),
    ]
    return " ".join(parts)


def _score_doc_for_terms(doc: dict[str, Any], terms: list[str]) -> int:
    """Earlier expanded terms weigh more so van beats a generic road match."""
    blob = _doc_search_blob(doc)
    score = 0
    for idx, term in enumerate(terms):
        if re.search(_regex_for_term(term), blob, re.I):
            score += max(1, len(terms) - idx)
    return score


def _rank_docs_by_terms(docs: list[dict[str, Any]], terms: list[str]) -> list[dict[str, Any]]:
    if len(docs) <= 1 or not terms:
        return docs
    return sorted(docs, key=lambda doc: _score_doc_for_terms(doc, terms), reverse=True)


def _serialize_search_hit(doc: dict[str, Any]) -> dict[str, Any]:
    gb = doc.get("glass_box") or {}
    return {
        "id": str(doc["_id"]),
        "sceneDescription": (doc.get("scene_description") or "")[:200],
        "observations": (gb.get("observations") or [])[:3],
        "scores": doc.get("scores"),
    }


def _atlas_text_search(
    terms: list[str],
    *,
    uid: Any,
    limit: int,
    projection: dict[str, Any],
) -> tuple[list[dict[str, Any]], str | None]:
    """Full-text search over scene descriptions and Glass Box text."""
    from memory import mcp_reads
    from memory.atlas_features import atlas_fallback_allowed, require_atlas_features
    from memory.db import get_db

    if not terms:
        return [], None

    coll = get_db().portfolio_entries
    match: dict[str, Any] = {"user_id": uid} if uid else {}
    atlas_query = " ".join(terms)

    try:
        pipeline: list[dict[str, Any]] = [
            {"$search": {"index": "glass_box_search", "text": {"query": atlas_query}}},
        ]
        if match:
            pipeline.append({"$match": match})
        pipeline.extend([{"$limit": max(limit * 4, 24)}, {"$project": projection}])
        docs = _rank_docs_by_terms(list(mcp_reads.aggregate(coll, pipeline)), terms)[:limit]
        if docs:
            return [_serialize_search_hit(doc) for doc in docs], "atlas_search"
    except Exception as exc:
        if require_atlas_features() and not atlas_fallback_allowed():
            raise RuntimeError(f"Atlas Search required: {exc}") from exc

    docs = list(
        mcp_reads.find(
            coll,
            _portfolio_text_search_filter(terms, match),
            projection=projection,
            limit=max(limit * 4, 24),
            sort=[("created_at", -1)],
        )
    )
    docs = _rank_docs_by_terms(docs, terms)[:limit]
    if docs:
        return [_serialize_search_hit(doc) for doc in docs], "regex_fallback"
    return [], None


def search_glass_box_feedback(query: str, limit: int = 5) -> dict[str, Any]:
    """
    Natural-language portfolio search over scene descriptions and tags.

    Gemini expands short queries into related metadata terms (tiger → lion, wildlife),
    then Atlas Search / word-boundary regex match the portfolio text. Image embeddings
    are reserved for photo-to-photo similarity, not NL library search.
    """
    from memory.assignments import _resolve_user_id
    from tools.search_query import expand_library_search_terms

    limit = max(1, min(int(limit), 15))
    q = query.strip()
    if not q:
        return {"matches": [], "message": "Provide a search query."}

    uid = _resolve_user_id(None)
    terms = list(expand_library_search_terms(q))
    projection = {
        "scores": 1,
        "aesthetic_tags": 1,
        "scene_description": 1,
        "glass_box": 1,
        "created_at": 1,
    }

    matches, mode = _atlas_text_search(
        terms,
        uid=uid,
        limit=limit,
        projection=projection,
    )

    return {
        "query": q,
        "searchTerms": terms,
        "mode": mode or "none",
        "matches": matches,
    }
