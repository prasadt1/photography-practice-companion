"""Print Sales sub-agent tools (§7.7)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db
from orchestrator.memory_tools import get_aesthetic_profile_summary


def get_print_sales_history(user_id: str | None = None, limit: int = 10) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"sales": []}
    docs = list(
        get_db().print_sales.find({"user_id": uid}).sort("listed_at", -1).limit(limit)
    )
    return {
        "sales": [
            {
                "id": str(d["_id"]),
                "marketplace": d.get("marketplace"),
                "revenue": d.get("revenue"),
                "unitsSold": d.get("units_sold"),
            }
            for d in docs
        ]
    }


def vector_search_similar_to_top_sellers(limit: int = 5) -> dict[str, Any]:
    """Recommend portfolio entries similar to best-selling listings."""
    uid = _resolve_user_id(None)
    if not uid:
        return {"recommendations": []}
    top = get_db().print_sales.find_one(
        {"user_id": uid, "units_sold": {"$gt": 0}},
        sort=[("revenue", -1)],
    )
    if not top or not top.get("portfolio_entry_id"):
        recent = list(
            get_db()
            .portfolio_entries.find({"user_id": uid})
            .sort("created_at", -1)
            .limit(limit)
        )
        return {
            "recommendations": [{"id": str(d["_id"]), "reason": "no_sales_history_yet"} for d in recent]
        }
    from sub_agents.tools.mentor_tools import vector_search_similar_photos

    return vector_search_similar_photos(str(top["portfolio_entry_id"]), limit=limit)


def aggregate_roi_by_marketplace(user_id: str | None = None) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"byMarketplace": {}}
    pipeline = [
        {"$match": {"user_id": uid}},
        {
            "$group": {
                "_id": "$marketplace",
                "revenue": {"$sum": "$revenue"},
                "units": {"$sum": "$units_sold"},
            }
        },
    ]
    rows = list(get_db().print_sales.aggregate(pipeline))
    return {
        "byMarketplace": {
            r["_id"]: {"revenue": r.get("revenue", 0), "units": r.get("units", 0)} for r in rows
        }
    }


def generate_listing_metadata(
    portfolio_entry_id: str,
    marketplace: str = "etsy",
) -> dict[str, Any]:
    """Draft listing copy (structured stub; full Gemini in Phase 2+)."""
    doc = get_db().portfolio_entries.find_one({"_id": ObjectId(portfolio_entry_id)})
    if not doc:
        return {"error": "Portfolio entry not found"}
    tags = doc.get("aesthetic_tags") or []
    scene = (doc.get("scene_description") or "Photograph")[:120]
    return {
        "marketplace": marketplace,
        "title": f"Fine art print — {tags[0] if tags else 'photography'}",
        "description": f"Archival print based on: {scene}",
        "tags": tags[:12],
        "suggestedListPrice": 45.0,
        "currency": "USD",
    }


def propose_listing_publication(
    portfolio_entry_id: str,
    marketplace: str,
    listing_metadata: dict[str, Any],
    reasoning: str,
) -> dict[str, Any]:
    uid = _resolve_user_id(None)
    if not uid:
        raise ValueError("No user context")
    doc = {
        "user_id": uid,
        "agent_name": "print_sales",
        "proposed_action": {
            "type": "list_on_marketplace",
            "target_id": portfolio_entry_id,
            "payload": {"marketplace": marketplace, **listing_metadata},
        },
        "agent_reasoning": reasoning,
        "status": "pending",
        "user_decision": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = get_db().pending_approvals.insert_one(doc)
    return {"pendingApprovalId": str(result.inserted_id), "status": "pending"}


def get_aesthetic_profile_summary_tool() -> dict[str, Any]:
    return get_aesthetic_profile_summary()
