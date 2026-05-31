"""Saved print listings (approved HITL) for Print Sales tab."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from memory.assignments import _resolve_user_id
from memory.db import get_db

LISTED_FOR_SALE_TAG = "listed_for_sale"


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    listed = doc.get("listed_at")
    created = doc.get("created_at")
    return {
        "id": str(doc["_id"]),
        "portfolioEntryId": str(doc.get("portfolio_entry_id", "")),
        "marketplace": doc.get("marketplace", "etsy"),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "listPrice": float(doc.get("list_price") or 0),
        "currency": doc.get("currency", "USD"),
        "status": doc.get("status", "listed"),
        "listedAt": listed.isoformat() if isinstance(listed, datetime) else None,
        "createdAt": created.isoformat() if isinstance(created, datetime) else None,
    }


def list_print_sales(user_id: str | None = None, *, limit: int = 50) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"items": [], "total": 0}
    docs = list(
        get_db()
        .print_sales.find({"user_id": uid, "status": "listed"})
        .sort("listed_at", -1)
        .limit(limit)
    )
    items = [_serialize(d) for d in docs]
    return {"items": items, "total": len(items)}
