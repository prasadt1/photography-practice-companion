#!/usr/bin/env python3
"""Curate demo portfolio to 10–12 diverse, score-spread photos for faster loads.

Keeps one best photo per subject category; drops duplicates and junk uploads.
Uses DEMO_USER_ID from .env (default hackathon demo user).

Usage:
  python3 scripts/curate-portfolio.py --dry-run
  python3 scripts/curate-portfolio.py --apply
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    from bson import ObjectId
    from dotenv import load_dotenv
    from pymongo import MongoClient
except ImportError:
    print("Install: python3 -m pip install pymongo python-dotenv", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

# 11 keepers — score spread ~5.2–8.8, 8 subject categories for judges
KEEP: dict[str, str] = {
    # Low tier (growth story)
    "6a132074569cef756b207bbe": "portrait — lowest real score (5.2)",
    # Craft / detail
    "6a14681c707a5f6bd109b39c": "craft — hands on loom (5.9)",
    # Food / still life
    "6a1b59f667c28f22ebc8c3c1": "food — fruit tart (6.9)",
    # Mountain / landscape
    "6a15424ca8e8181d9c950d6b": "mountain — sunset over range (7.3)",
    "6a1478e8961bc0c45c3b541e": "nature — ancient oak tree (7.9)",
    "6a154965a8e8181d9c950d71": "mountain — river gorge aerial (8.6)",
    # Sunset / coast
    "6a154437a8e8181d9c950d6d": "sunset — ocean + palm silhouettes (8.0)",
    # Water
    "6a1739b461bd962d86d3c628": "waterfall — mossy rocks close-up (8.2)",
    # Vehicle
    "6a1c7730b3cf05cbb677a38f": "van — camper on dirt road (8.3, home hero)",
    # Animals
    "6a253e17dff92fc66dc35e6a": "animal — deer in field (8.3)",
    "6a21fe999bf74d9778408050": "animal — horse in snow (8.8)",
}


def avg_score(scores: dict) -> float:
    keys = ("composition", "lighting", "technique", "creativity", "subject_impact")
    vals = [float(scores[k]) for k in keys if k in scores and scores[k] is not None]
    return round(sum(vals) / len(vals), 1) if vals else 0.0


def main() -> None:
    parser = argparse.ArgumentParser(description="Curate portfolio to curated keep list")
    parser.add_argument("--apply", action="store_true", help="Delete non-keepers (default: dry run)")
    parser.add_argument("--dry-run", action="store_true", help="Print plan only")
    args = parser.parse_args()
    apply = args.apply and not args.dry_run

    uri = os.environ.get("MONGODB_URI")
    if not uri:
        print("ERROR: MONGODB_URI not set", file=sys.stderr)
        sys.exit(1)

    demo_hex = os.environ.get("DEMO_USER_ID", "6577a1f2b3c4d5e6f7a8b9c0")
    uid = ObjectId(demo_hex) if len(demo_hex) == 24 else demo_hex
    db = MongoClient(uri)[os.environ.get("MONGODB_DB_NAME", "practice_companion")]
    coll = db.portfolio_entries

    keep_oids = {ObjectId(k) for k in KEEP}
    docs = list(coll.find({"user_id": uid}))
    to_delete = [d for d in docs if d["_id"] not in keep_oids]
    missing = keep_oids - {d["_id"] for d in docs}

    print(f"User: {uid}")
    print(f"Current: {len(docs)} entries → keep {len(KEEP)} → delete {len(to_delete)}\n")

    if missing:
        print("WARNING: keep IDs not found in DB:")
        for oid in missing:
            print(f"  {oid}")
        print()

    print("=== KEEP ===")
    for doc in sorted(docs, key=lambda d: avg_score(d.get("scores") or {})):
        if doc["_id"] not in keep_oids:
            continue
        sid = str(doc["_id"])
        scene = (doc.get("scene_description") or "")[:70]
        print(f"  {avg_score(doc.get('scores') or {}):4.1f} | {sid} | {KEEP[sid]}")
        print(f"         {scene}…")

    print("\n=== DELETE ===")
    for doc in sorted(to_delete, key=lambda d: avg_score(d.get("scores") or {})):
        sid = str(doc["_id"])
        scene = (doc.get("scene_description") or "")[:70]
        print(f"  {avg_score(doc.get('scores') or {}):4.1f} | {sid} | {scene}…")

    if not apply:
        print(f"\nDry run — re-run with --apply to delete {len(to_delete)} entries.")
        return

    if to_delete:
        delete_ids = [d["_id"] for d in to_delete]
        delete_id_strs = {str(x) for x in delete_ids}
        result = coll.delete_many({"_id": {"$in": delete_ids}})
        print(f"\nDeleted {result.deleted_count} portfolio entries.")

        # Drop stale HITL rows referencing removed entries
        pending = db.pending_approvals
        stale = 0
        for doc in pending.find({"user_id": uid, "status": "pending"}):
            payload = doc.get("payload") or {}
            refs = {
                str(payload.get("portfolio_entry_id", "")),
                str(payload.get("entry_id", "")),
            }
            if refs & delete_id_strs:
                pending.update_one(
                    {"_id": doc["_id"], "status": "pending"},
                    {"$set": {"status": "rejected", "decision_reason": "entry_curated"}},
                )
                stale += 1
        if stale:
            print(f"Rejected {stale} pending approval(s) for deleted entries.")
    else:
        print("\nNothing to delete.")

    remaining = coll.count_documents({"user_id": uid})
    print(f"Remaining: {remaining} entries")


if __name__ == "__main__":
    main()
