#!/usr/bin/env python3
"""Backfill text_embedding on portfolio_entries from scene metadata."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
sys.path.insert(0, str(APP))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from memory.db import get_db  # noqa: E402
from tools.embeddings import embed_text, portfolio_search_text  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", help="Limit to one demo user ObjectId hex")
    parser.add_argument("--dry-run", action="store_true", help="List candidates only")
    parser.add_argument("--limit", type=int, default=0, help="Max docs to update (0 = all)")
    args = parser.parse_args()

    query: dict = {"text_embedding": {"$exists": False}}
    if args.user_id:
        from bson import ObjectId

        query["user_id"] = ObjectId(args.user_id)

    coll = get_db().portfolio_entries
    cursor = coll.find(
        query,
        projection={
            "scene_description": 1,
            "aesthetic_tags": 1,
            "colour_notes": 1,
            "user_tags": 1,
        },
    )
    updated = 0
    skipped = 0
    for doc in cursor:
        if args.limit and updated >= args.limit:
            break
        text = portfolio_search_text(
            doc.get("scene_description") or "",
            doc.get("aesthetic_tags") or [],
            colour_notes=doc.get("colour_notes"),
            user_tags=doc.get("user_tags"),
        )
        if not text.strip():
            skipped += 1
            continue
        if args.dry_run:
            print(doc["_id"], text[:80].replace("\n", " "))
            updated += 1
            continue
        vector = embed_text(text)
        coll.update_one({"_id": doc["_id"]}, {"$set": {"text_embedding": vector}})
        updated += 1
        print(f"updated {doc['_id']} ({updated})")

    print(f"done: updated={updated} skipped_no_text={skipped}")


if __name__ == "__main__":
    main()
