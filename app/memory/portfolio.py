"""Portfolio reads for Memory tab (Phase 3)."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.user_ids import to_mongo_user_id

from memory.db import get_db
from tools.gcs import signed_https_url

logger = logging.getLogger(__name__)


def _avg_score(scores: dict[str, Any]) -> float:
    keys = ("composition", "lighting", "technique", "creativity", "subject_impact")
    vals = [float(scores[k]) for k in keys if k in scores and scores[k] is not None]
    return sum(vals) / len(vals) if vals else 0.0


def _image_url_for_client(gs_or_https: str) -> str:
    if gs_or_https.startswith("gs://"):
        try:
            return signed_https_url(gs_or_https)
        except Exception as exc:
            logger.warning("signed URL failed for %s: %s", gs_or_https[:80], exc)
            return ""
    return gs_or_https


def _serialize_mongo_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    """JSON-safe dict for API responses (ObjectId, datetime, etc.)."""
    if not doc:
        return None
    out: dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = str(value)
        elif isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, datetime):
            out[key] = value.isoformat()
        elif isinstance(value, dict):
            out[key] = _serialize_mongo_doc(value) or {}
        elif isinstance(value, list):
            out[key] = [
                str(v)
                if isinstance(v, ObjectId)
                else v.isoformat()
                if isinstance(v, datetime)
                else v
                for v in value
            ]
        else:
            out[key] = value
    return out


def _serialize_entry(doc: dict[str, Any]) -> dict[str, Any]:
    scores = doc.get("scores") or {}
    created = doc.get("created_at")
    if isinstance(created, datetime):
        created_iso = created.isoformat()
    else:
        created_iso = str(created) if created else ""

    thumb = doc.get("thumbnail_url") or doc.get("image_url") or ""
    return {
        "id": str(doc["_id"]),
        "userId": str(doc.get("user_id", "")),
        "shootId": str(doc.get("shoot_id", "")),
        "imageUrl": _image_url_for_client(thumb),
        "createdAt": created_iso,
        "scores": scores,
        "overallAverage": round(_avg_score(scores), 1),
        "aestheticTags": doc.get("aesthetic_tags") or [],
        "userTags": doc.get("user_tags") or [],
        "sceneDescription": doc.get("scene_description"),
        "colourNotes": doc.get("colour_notes"),
        "glassBoxSummary": (doc.get("glass_box") or {}).get("observations", [])[:2],
    }


def _portfolio_user_query(user_id: str | None = None) -> dict[str, Any]:
    query: dict[str, Any] = {}
    demo_user = os.environ.get("DEMO_USER_ID")
    if user_id:
        query["user_id"] = to_mongo_user_id(user_id)
    elif demo_user:
        query["user_id"] = ObjectId(demo_user)
    return query


def get_portfolio_stats(*, user_id: str | None = None) -> dict[str, Any]:
    """Portfolio total, first upload month, and highest-scoring entry."""
    query = _portfolio_user_query(user_id)
    coll = get_db().portfolio_entries

    total = coll.count_documents(query) if query else coll.estimated_document_count()

    first_entry = coll.find_one(query, sort=[("created_at", 1)], projection={"created_at": 1})
    first_upload = None
    if first_entry and "created_at" in first_entry:
        dt = first_entry["created_at"]
        if isinstance(dt, datetime):
            first_upload = dt.strftime("%b %Y")

    pipeline = [
        {"$match": query} if query else {"$match": {}},
        {
            "$addFields": {
                "_avgScore": {
                    "$avg": [
                        "$scores.composition",
                        "$scores.lighting",
                        "$scores.technique",
                        "$scores.creativity",
                        "$scores.subject_impact",
                    ]
                }
            }
        },
        {"$sort": {"_avgScore": -1}},
        {"$limit": 1},
        {"$project": {"embedding": 0, "_avgScore": 0}},
    ]
    strongest_docs = list(coll.aggregate(pipeline))
    strongest = _serialize_entry(strongest_docs[0]) if strongest_docs else None

    return {
        "total": total,
        "firstUpload": first_upload,
        "strongest": strongest,
    }


# Valid sort fields and their MongoDB field mappings
_SORT_FIELDS = {
    "date": "created_at",
    "score": "scores._avg",  # computed field, handled specially
    "composition": "scores.composition",
    "lighting": "scores.lighting",
    "technique": "scores.technique",
    "creativity": "scores.creativity",
    "subject_impact": "scores.subject_impact",
}


def list_portfolio_entries(
    *,
    limit: int = 48,
    user_id: str | None = None,
    sort_by: str = "date",
    sort_order: str = "desc",
    user_tag: str | None = None,
) -> dict[str, Any]:
    """List portfolio entries with optional sorting and filtering.

    Args:
        limit: Max entries to return (1-100)
        user_id: Filter by user
        sort_by: Field to sort by (date, score, composition, lighting, technique, creativity, subject_impact)
        sort_order: Sort direction (asc, desc)
        user_tag: Filter by user-applied tag (exact match)
    """
    query = _portfolio_user_query(user_id)

    # Filter by user-applied tag if specified
    if user_tag:
        query["user_tags"] = user_tag

    from memory import mcp_reads

    # Determine sort direction
    direction = 1 if sort_order.lower() == "asc" else -1

    # Handle overall score sort specially (requires aggregation or post-sort)
    if sort_by == "score":
        # For overall score, we need to compute average and sort
        # Use aggregation pipeline for efficiency
        coll = get_db().portfolio_entries
        pipeline = [
            {"$match": query} if query else {"$match": {}},
            {"$addFields": {
                "_avgScore": {
                    "$avg": [
                        "$scores.composition",
                        "$scores.lighting",
                        "$scores.technique",
                        "$scores.creativity",
                        "$scores.subject_impact",
                    ]
                }
            }},
            {"$sort": {"_avgScore": direction}},
            {"$limit": max(1, min(limit, 100))},
            {"$project": {"embedding": 0, "_avgScore": 0}},
        ]
        docs = list(coll.aggregate(pipeline))
    else:
        # Standard sort on a single field
        sort_field = _SORT_FIELDS.get(sort_by, "created_at")
        coll = get_db().portfolio_entries
        docs = mcp_reads.find(
            coll,
            query,
            projection={"embedding": 0},
            limit=max(1, min(limit, 100)),
            sort=[(sort_field, direction)],
        )

    entries = [_serialize_entry(doc) for doc in docs]
    coll = get_db().portfolio_entries
    total_count = coll.count_documents(query) if query else coll.estimated_document_count()
    return {"entries": entries, "total": total_count}


def compute_aesthetic_summary(
    *,
    user_id: str | None = None,
    sample_size: int = 20,
) -> dict[str, Any]:
    """Lightweight profile until change-stream listener is deployed."""
    query: dict[str, Any] = {}
    demo_user = os.environ.get("DEMO_USER_ID")
    if user_id:
        query["user_id"] = to_mongo_user_id(user_id)
    elif demo_user:
        query["user_id"] = ObjectId(demo_user)

    total_photos = (
        get_db().portfolio_entries.count_documents(query) if query else 0
    )

    from memory import mcp_reads

    coll = get_db().portfolio_entries
    docs = mcp_reads.find(
        coll,
        query,
        projection={"scores": 1, "aesthetic_tags": 1},
        limit=sample_size,
        sort=[("created_at", -1)],
    )
    if not docs:
        return {
            "photoCount": total_photos,
            "profileSampleSize": 0,
            "dominantTags": [],
            "averageScores": {},
            "stylisticConsistencyScore": None,
        }

    tag_counts: dict[str, int] = {}
    sums = {k: 0.0 for k in ("composition", "lighting", "technique", "creativity", "subject_impact")}
    for doc in docs:
        for tag in doc.get("aesthetic_tags") or []:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        scores = doc.get("scores") or {}
        for k in sums:
            sums[k] += float(scores.get(k, 0))

    n = len(docs)
    avg_scores = {k: round(sums[k] / n, 1) for k in sums}
    avgs_list = list(avg_scores.values())
    mean = sum(avgs_list) / len(avgs_list)
    variance = sum((x - mean) ** 2 for x in avgs_list) / len(avgs_list)
    consistency = max(0.0, min(1.0, 1.0 - (variance / 25.0)))

    dominant = sorted(tag_counts.items(), key=lambda x: -x[1])[:8]

    stored = None
    if demo_user or user_id:
        uid = to_mongo_user_id(user_id) if user_id else ObjectId(demo_user)
        stored = get_db().aesthetic_profile.find_one({"user_id": uid})

    return {
        "photoCount": total_photos,
        "profileSampleSize": n,
        "dominantTags": [t for t, _ in dominant],
        "averageScores": avg_scores,
        "stylisticConsistencyScore": round(consistency, 2),
        "storedProfile": _serialize_mongo_doc(stored),
        "computedAt": datetime.now(timezone.utc).isoformat(),
    }


LISTED_FOR_SALE_TAG = "listed_for_sale"


def get_portfolio_entry(entry_id: str, *, user_id: str | None = None) -> dict[str, Any]:
    """Fetch one portfolio entry owned by the user."""
    uid = _resolve_portfolio_user_id(user_id)
    try:
        oid = ObjectId(entry_id)
    except Exception as exc:
        raise ValueError("Invalid portfolio entry id") from exc

    query: dict[str, Any] = {"_id": oid}
    if uid:
        query["user_id"] = uid
    doc = get_db().portfolio_entries.find_one(query, {"embedding": 0})
    if not doc:
        raise ValueError("Portfolio entry not found")
    return _serialize_entry(doc)


def list_portfolio_by_shoot_ids(
    shoot_ids: list[str],
    *,
    user_id: str | None = None,
) -> dict[str, Any]:
    """Resolve portfolio entries for assignment baseline/completion shoot ids."""
    if not shoot_ids:
        return {"entries": []}
    oids: list[ObjectId] = []
    for sid in shoot_ids:
        try:
            oids.append(ObjectId(sid))
        except Exception:
            continue
    if not oids:
        return {"entries": []}

    query = _portfolio_user_query(user_id)
    query["shoot_id"] = {"$in": oids}
    docs = list(
        get_db()
        .portfolio_entries.find(query, {"embedding": 0})
        .sort("created_at", -1)
    )
    return {"entries": [_serialize_entry(d) for d in docs]}


def _resolve_portfolio_user_id(user_id: str | None) -> ObjectId | None:
    from memory.assignments import _resolve_user_id

    return _resolve_user_id(user_id)


def _reject_pending_for_entry(entry_id: str, uid: ObjectId) -> int:
    """Auto-reject pending HITL proposals that reference a deleted entry."""
    now = datetime.now(timezone.utc)
    coll = get_db().pending_approvals
    rejected = 0
    for doc in coll.find({"user_id": uid, "status": "pending"}):
        pa = doc.get("proposed_action") or {}
        payload = pa.get("payload") or {}
        targets_entry = (
            pa.get("type") == "delete_entry"
            and (pa.get("target_id") == entry_id or payload.get("entryId") == entry_id)
        ) or (
            pa.get("type") == "apply_tags"
            and entry_id in (payload.get("entryIds") or [])
        ) or (
            pa.get("type") == "list_on_marketplace"
            and (pa.get("target_id") == entry_id or payload.get("portfolio_entry_id") == entry_id)
        )
        if not targets_entry:
            continue
        coll.update_one(
            {"_id": doc["_id"], "status": "pending"},
            {
                "$set": {
                    "status": "rejected",
                    "user_decision": {
                        "action": "reject",
                        "override_payload": None,
                        "decided_at": now,
                        "reason": "entry_deleted_by_user",
                    },
                }
            },
        )
        rejected += 1
    return rejected


def _unlist_portfolio_entry(entry_id: str, uid: ObjectId) -> bool:
    """Remove print-sales listing and tag so the photo can leave the library."""
    now = datetime.now(timezone.utc)
    db = get_db()
    db.print_sales.update_many(
        {
            "user_id": uid,
            "portfolio_entry_id": entry_id,
            "status": "listed",
        },
        {"$set": {"status": "removed", "removed_at": now}},
    )
    result = db.portfolio_entries.update_one(
        {"_id": ObjectId(entry_id), "user_id": uid},
        {"$pull": {"user_tags": LISTED_FOR_SALE_TAG}},
    )
    return result.modified_count > 0


def delete_portfolio_entry(
    entry_id: str,
    *,
    user_id: str | None = None,
    remove_listing: bool = False,
) -> dict[str, Any]:
    """User-initiated delete (distinct from HITL delete_entry approval)."""
    uid = _resolve_portfolio_user_id(user_id)
    if not uid:
        raise ValueError("Set DEMO_USER_ID or sign in to delete photos")

    try:
        oid = ObjectId(entry_id)
    except Exception as exc:
        raise ValueError("Invalid portfolio entry id") from exc

    doc = get_db().portfolio_entries.find_one({"_id": oid, "user_id": uid})
    if not doc:
        raise ValueError("Portfolio entry not found")

    user_tags = doc.get("user_tags") or []
    unlisted = False
    if LISTED_FOR_SALE_TAG in user_tags:
        if not remove_listing:
            raise ValueError(
                "This photo is listed for sale — remove the listing before deleting from your library"
            )
        unlisted = _unlist_portfolio_entry(entry_id, uid)

    get_db().portfolio_entries.delete_one({"_id": oid})
    cancelled = _reject_pending_for_entry(entry_id, uid)
    return {
        "deleted": True,
        "id": entry_id,
        "cancelledPending": cancelled,
        "unlisted": unlisted,
    }


def delete_portfolio_entries(
    entry_ids: list[str],
    *,
    user_id: str | None = None,
    remove_listing: bool = False,
) -> dict[str, Any]:
    """Bulk delete — skips entries that fail validation."""
    deleted: list[str] = []
    skipped: list[dict[str, str]] = []
    for eid in entry_ids:
        try:
            delete_portfolio_entry(eid, user_id=user_id, remove_listing=remove_listing)
            deleted.append(eid)
        except ValueError as exc:
            skipped.append({"id": eid, "reason": str(exc)})
    return {"deleted": deleted, "skipped": skipped, "deletedCount": len(deleted)}
