"""Portfolio search and vector similarity for My Work (hackathon)."""

from __future__ import annotations

import math
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db
from memory.portfolio import _image_url_for_client, _serialize_entry
from memory.session_context import resolve_effective_user_id
from orchestrator.memory_tools import search_glass_box_feedback
from sub_agents.tools.mentor_tools import vector_search_similar_photos


def _entry_owned_by_user(entry_id: str, uid: ObjectId) -> dict[str, Any] | None:
    try:
        oid = ObjectId(entry_id)
    except Exception:
        return None
    return get_db().portfolio_entries.find_one({"_id": oid, "user_id": uid})


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _fallback_similar_by_embedding(
    uid: ObjectId,
    source_id: str,
    source_embedding: list[float],
    *,
    limit: int,
) -> list[dict[str, Any]]:
    """In-process cosine similarity when Atlas vector index returns nothing."""
    coll = get_db().portfolio_entries
    candidates = list(
        coll.find(
            {"user_id": uid, "embedding": {"$exists": True, "$ne": None}},
            projection={"embedding": 1},
            limit=80,
            sort=[("created_at", -1)],
        )
    )
    scored: list[tuple[float, str]] = []
    for doc in candidates:
        eid = str(doc["_id"])
        if eid == source_id:
            continue
        emb = doc.get("embedding")
        if not emb or len(emb) != len(source_embedding):
            continue
        scored.append((_cosine_similarity(source_embedding, emb), eid))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [{"id": eid, "score": score} for score, eid in scored[:limit] if score > 0.5]


def _enrich_match_ids(match_ids: list[str]) -> list[dict[str, Any]]:
    if not match_ids:
        return []
    oids = []
    for mid in match_ids:
        try:
            oids.append(ObjectId(mid))
        except Exception:
            continue
    if not oids:
        return []
    docs = list(
        get_db()
        .portfolio_entries.find({"_id": {"$in": oids}})
    )
    by_id = {str(d["_id"]): d for d in docs}
    out: list[dict[str, Any]] = []
    for mid in match_ids:
        doc = by_id.get(mid)
        if not doc:
            continue
        row = _serialize_entry(doc)
        out.append(row)
    return out


def get_similar_portfolio_photos(
    portfolio_entry_id: str,
    *,
    user_id: str | None = None,
    limit: int = 4,
) -> dict[str, Any]:
    """Vector similarity over the user's library (Atlas Vector Search when configured)."""
    effective = resolve_effective_user_id(user_id)
    uid = _resolve_user_id(effective)
    if not uid:
        raise ValueError("Set DEMO_USER_ID in .env or pass user_id")

    limit = max(1, min(int(limit), 12))
    source = _entry_owned_by_user(portfolio_entry_id, uid)
    if not source:
        return {"matches": [], "message": "Photo not found."}

    raw = vector_search_similar_photos(portfolio_entry_id, limit=limit)
    if raw.get("message") and not raw.get("matches"):
        return {"sourceId": portfolio_entry_id, "matches": [], "message": raw["message"]}

    score_by_id = {m["id"]: m.get("score") for m in raw.get("matches") or []}
    mode = "atlas_vector_search"

    if not score_by_id and source.get("embedding"):
        for row in _fallback_similar_by_embedding(
            uid,
            portfolio_entry_id,
            source["embedding"],
            limit=limit,
        ):
            score_by_id[row["id"]] = row.get("score")
        if score_by_id:
            mode = "cosine_fallback"

    enriched = _enrich_match_ids(list(score_by_id.keys()))
    for row in enriched:
        row["similarityScore"] = score_by_id.get(row["id"])

    return {
        "sourceId": portfolio_entry_id,
        "matches": enriched,
        "message": raw.get("message"),
        "mode": mode,
    }


def search_portfolio_library(
    query: str,
    *,
    user_id: str | None = None,
    limit: int = 8,
) -> dict[str, Any]:
    """Full-text + semantic search over scene descriptions and portfolio embeddings."""
    effective = resolve_effective_user_id(user_id)
    uid = _resolve_user_id(effective)
    if not uid:
        raise ValueError("Set DEMO_USER_ID in .env or pass user_id")

    limit = max(1, min(int(limit), 20))
    raw = search_glass_box_feedback(query.strip(), limit=limit)
    match_ids = [m["id"] for m in raw.get("matches") or [] if m.get("id")]
    enriched = _enrich_match_ids(match_ids)
    obs_by_id = {m["id"]: m.get("observations") for m in raw.get("matches") or []}
    score_by_id = {m["id"]: m.get("similarityScore") for m in raw.get("matches") or []}
    for row in enriched:
        row["matchedObservations"] = obs_by_id.get(row["id"]) or []
        if score_by_id.get(row["id"]) is not None:
            row["similarityScore"] = score_by_id[row["id"]]

    return {
        "query": raw.get("query", query),
        "searchTerms": raw.get("searchTerms") or [],
        "mode": raw.get("mode"),
        "matches": enriched,
        "message": raw.get("message"),
    }
