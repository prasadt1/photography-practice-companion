"""MongoDB collections and compound indexes for v5 (spec §6.3). Idempotent bootstrap."""

from __future__ import annotations

import os
import sys
from typing import Any

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import CollectionInvalid, OperationFailure

COLLECTIONS = [
    "users",
    "portfolio_entries",
    "assignments",
    "conversations",
    "aesthetic_profile",
    "client_outcomes",
    "print_sales",
    "capture_sessions",
    "pending_approvals",
]

INDEXES: dict[str, list[tuple[list, dict[str, Any]]]] = {
    "portfolio_entries": [
        ([("user_id", ASCENDING), ("created_at", DESCENDING)], {"name": "user_id_created_at"}),
        ([("shoot_id", ASCENDING)], {"name": "shoot_id"}),
        ([("client_id", ASCENDING)], {"name": "client_id", "sparse": True}),
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
    "client_outcomes": [
        (
            [("user_id", ASCENDING), ("client_id", ASCENDING), ("delivered_at", DESCENDING)],
            {"name": "user_id_client_id_delivered_at"},
        ),
    ],
    "print_sales": [
        (
            [("user_id", ASCENDING), ("marketplace", ASCENDING), ("listed_at", DESCENDING)],
            {"name": "user_id_marketplace_listed_at"},
        ),
        ([("first_sale_at", ASCENDING)], {"name": "first_sale_at", "sparse": True}),
    ],
    "capture_sessions": [
        ([("user_id", ASCENDING), ("started_at", DESCENDING)], {"name": "user_id_started_at"}),
    ],
    "pending_approvals": [
        ([("user_id", ASCENDING), ("status", ASCENDING), ("created_at", DESCENDING)], {"name": "user_id_status_created_at"}),
        (
            [("user_id", ASCENDING), ("agent_name", ASCENDING)],
            {"name": "user_id_agent_name", "sparse": True},
        ),
    ],
}


def ensure_collections(db) -> None:
    for name in COLLECTIONS:
        try:
            db.create_collection(name)
        except CollectionInvalid:
            pass


def ensure_indexes(db) -> None:
    for coll_name, specs in INDEXES.items():
        coll: Collection = db[coll_name]
        for keys, opts in specs:
            try:
                coll.create_index(keys, **opts)
            except OperationFailure as exc:
                print(f"  index {coll_name}.{opts.get('name')}: {exc.details.get('errmsg', exc)}")


def migrate_users_v5(db) -> int:
    """Add persona + preferences to existing users (Phase 0)."""
    result = db.users.update_many(
        {"persona": {"$exists": False}},
        {
            "$set": {
                "persona": "hobbyist",
                "preferences": {},
            }
        },
    )
    return result.modified_count


def bootstrap(db_name: str | None = None, uri: str | None = None) -> None:
    uri = uri or os.environ.get("MONGODB_URI")
    if not uri:
        raise SystemExit("MONGODB_URI not set")
    db_name = db_name or os.environ.get("MONGODB_DB_NAME", "practice_companion")

    client = MongoClient(uri, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    db = client[db_name]

    print(f"Connected. Database: {db_name}")
    ensure_collections(db)
    ensure_indexes(db)
    n = migrate_users_v5(db)
    print(f"  users migrated (persona): {n}")
    print("\nAtlas UI still required for: vector index, glass_box_search, scene_search (§6.3)")


def main() -> None:
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except ImportError:
        pass
    bootstrap()


if __name__ == "__main__":
    main()
