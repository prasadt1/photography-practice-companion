#!/usr/bin/env python3
"""Idempotent MongoDB bootstrap for practice_companion (collections + compound indexes).

Vector Search and Atlas Search indexes must be created in Atlas UI or via MCP/Atlas API.
See docs/mongodb-setup.md and docs/infrastructure-deployment.md.
"""
from __future__ import annotations

import os
import sys

try:
    from dotenv import load_dotenv
    from pymongo import ASCENDING, DESCENDING, MongoClient
    from pymongo.errors import CollectionInvalid, OperationFailure
except ImportError:
    print("Install: python3 -m pip install pymongo python-dotenv", file=sys.stderr)
    sys.exit(1)

load_dotenv()

URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "practice_companion")

COLLECTIONS = [
    "users",
    "portfolio_entries",
    "assignments",
    "conversations",
    "aesthetic_profile",
]

INDEXES: dict[str, list] = {
    "portfolio_entries": [
        ([("user_id", ASCENDING), ("created_at", DESCENDING)], {"name": "user_id_created_at"}),
        ([("shoot_id", ASCENDING)], {"name": "shoot_id"}),
    ],
    "assignments": [
        ([("user_id", ASCENDING), ("status", ASCENDING)], {"name": "user_id_status"}),
    ],
    "conversations": [
        ([("user_id", ASCENDING), ("last_active", DESCENDING)], {"name": "user_id_last_active"}),
    ],
    "aesthetic_profile": [
        ([("user_id", ASCENDING)], {"name": "user_id", "unique": True}),
    ],
}


def main() -> None:
    if not URI:
        print("MONGODB_URI not set. Copy .env.example to .env", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(URI, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    db = client[DB_NAME]

    print(f"Connected. Database: {DB_NAME}")

    for name in COLLECTIONS:
        try:
            db.create_collection(name)
            print(f"  created collection: {name}")
        except CollectionInvalid:
            print(f"  collection exists: {name}")

    for coll, specs in INDEXES.items():
        for keys, opts in specs:
            name = opts.get("name", "_".join(f"{k[0]}_{k[1]}" for k in keys))
            try:
                db[coll].create_index(keys, **opts)
                print(f"  index {coll}.{name}")
            except OperationFailure as e:
                print(f"  index {coll}.{name}: {e.details.get('errmsg', e)}")

    print("\nDone. Next steps:")
    print("  1–2. Atlas UI: docs/atlas-indexes-setup.md (vector + glass_box_search)")
    print("  3. python3 scripts/seed-demo-data.py  (Phase 3 — not created yet)")


if __name__ == "__main__":
    main()
