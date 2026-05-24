#!/usr/bin/env python3
"""Seed demo portfolio, assignments, and aesthetic profile for hackathon judges.

Image URLs: Unsplash (https://unsplash.com/license) — free for use including commercial.
No binary upload required; Memory tab uses HTTPS URLs directly.

Idempotent: re-run skips if demo user already has portfolio unless --reset.

After seeding, add to .env:
  DEMO_USER_ID=6577a1f2b3c4d5e6f7a8b9c0
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

try:
    from bson import ObjectId
    from dotenv import load_dotenv
    from pymongo import MongoClient
except ImportError:
    print("Install: python3 -m pip install pymongo python-dotenv", file=sys.stderr)
    sys.exit(1)

load_dotenv()

URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "practice_companion")

# Stable demo user — set DEMO_USER_ID in .env to this hex string
DEMO_USER_HEX = "6577a1f2b3c4d5e6f7a8b9c0"
DEMO_USER_ID = ObjectId(DEMO_USER_HEX)

SHOOT_IDS = [
    ObjectId("6577a1f2b3c4d5e6f7a8b9c1"),  # baseline — weak composition
    ObjectId("6577a1f2b3c4d5e6f7a8b9c2"),  # post-assignment — improved
    ObjectId("6577a1f2b3c4d5e6f7a8b9c3"),  # lighting exploration
    ObjectId("6577a1f2b3c4d5e6f7a8b9c4"),  # diverse subjects
]

# Unsplash photo IDs — license: https://unsplash.com/license
_UNSPLASH = "https://images.unsplash.com/photo-{id}?w=900&q=80"


def _img(photo_id: str) -> str:
    return _UNSPLASH.format(id=photo_id)


def _entry(
    shoot_idx: int,
    days_ago: int,
    scores: dict[str, float],
    tags: list[str],
    scene: str,
    observations: list[str],
) -> dict:
    now = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=shoot_idx * 2)
    return {
        "user_id": DEMO_USER_ID,
        "shoot_id": SHOOT_IDS[shoot_idx],
        "image_url": _img("1493864449600-6fbfaa779b4f"),
        "thumbnail_url": _img("1493864449600-6fbfaa779b4f"),
        "scores": scores,
        "scene_description": scene,
        "colour_notes": "Warm and natural palette with balanced contrast.",
        "glass_box": {
            "observations": observations,
            "reasoning_steps": [
                "Compared framing to rule-of-thirds guidance from principles.",
                "Evaluated light direction and shadow quality on the subject.",
            ],
            "priority_fixes": [
                {"severity": "moderate", "issue": observations[-1] if observations else "Refine framing."},
            ],
            "grounding_principles": ["composition.md", "lighting.md"],
        },
        "spatial_metadata": {
            "annotations": [],
            "subject_relationships": {
                "primary_subject_position": "center",
                "secondary_subjects": [],
                "depth_axis": "foreground_midground",
                "leading_lines_present": False,
            },
            "lighting_map": {
                "key_light_direction": "upper_left",
                "fill_light_strength": "low",
                "rim_light_present": False,
                "color_temperature": "warm",
                "shadow_character": "soft",
            },
        },
        "aesthetic_tags": tags,
        "created_at": now,
    }


# 16 entries — 4 per shoot (varied Unsplash ids per row in loop)
# All verified HTTP 200 on images.unsplash.com (May 2026)
_VERIFIED_UNSPLASH = [
    "1523275335684-37898b6baf30",
    "1505740420928-5e560c06d30e",
    "1526170375885-4d8ecf77b99f",
    "1542291026-7eec264c27ff",
    "1487412720507-e7ab37603c6f",
    "1472214103451-9374bd1c798e",
    "1519681393784-d120267933ba",
    "1506905925346-21bda4d32df4",
    "1441974231531-c6227db76b6e",
    "1500530855697-b586d89ba3ee",
    "1511285560929-80b456fea0bc",
    "1524758631624-e2822e304c36",
    "1558618666-fcd25c85cd64",
]
# 16 slots — pad with distinct verified IDs (no 404s)
_PHOTOS = _VERIFIED_UNSPLASH + [
    _VERIFIED_UNSPLASH[3],
    _VERIFIED_UNSPLASH[6],
    _VERIFIED_UNSPLASH[9],
]

_PORTFOLIO_FIXTURES: list[dict] = []
for i, photo in enumerate(_PHOTOS):
    shoot = i // 4
    comp = 4.2 + shoot * 0.9 + (i % 4) * 0.15
    light = 5.5 + shoot * 0.5
    _PORTFOLIO_FIXTURES.append(
        {
            "shoot_idx": shoot,
            "days_ago": 28 - i * 1,
            "photo": photo,
            "scores": {
                "composition": round(min(9.0, comp), 1),
                "lighting": round(min(9.0, light), 1),
                "technique": round(5.8 + shoot * 0.4, 1),
                "creativity": round(4.5 + shoot * 0.35, 1),
                "subject_impact": round(5.5 + shoot * 0.45, 1),
            },
            "tags": [["portrait", "natural_light"], ["flat_lay", "craft"], ["landscape", "golden_hour"], ["still_life", "minimalist"]][shoot],
            "scene": [
                "A portrait-oriented frame with the subject centered against a soft background.",
                "A flat lay of handmade textiles arranged on a neutral surface.",
                "An open landscape under late-day sky with layered depth in the midground.",
                "A single still-life object on wood with shallow depth of field.",
            ][shoot],
            "observations": [
                "Subject sits near center; limited negative space on the sides.",
                "Items cluster in the middle; edges feel crowded.",
                "Horizon sits high; foreground lacks a clear anchor.",
                "Warm side light models texture well; background is calm.",
            ],
        }
    )


def build_portfolio_docs() -> list[dict]:
    docs = []
    for fix in _PORTFOLIO_FIXTURES:
        doc = _entry(
            fix["shoot_idx"],
            fix["days_ago"],
            fix["scores"],
            fix["tags"],
            fix["scene"],
            fix["observations"],
        )
        url = _img(fix["photo"])
        doc["image_url"] = url
        doc["thumbnail_url"] = url
        docs.append(doc)
    return docs


def seed(db, *, reset: bool) -> None:
    if reset:
        db.portfolio_entries.delete_many({"user_id": DEMO_USER_ID})
        db.assignments.delete_many({"user_id": DEMO_USER_ID})
        db.aesthetic_profile.delete_many({"user_id": DEMO_USER_ID})
        db.users.delete_many({"_id": DEMO_USER_ID})
        print("Cleared existing demo user data.")

    if db.portfolio_entries.count_documents({"user_id": DEMO_USER_ID}) > 0:
        print("Demo portfolio already exists. Use --reset to replace.")
        return

    db.users.insert_one(
        {
            "_id": DEMO_USER_ID,
            "display_name": "Demo Photographer",
            "mode": "hobbyist",
            "created_at": datetime.now(timezone.utc),
        }
    )

    portfolio = build_portfolio_docs()
    db.portfolio_entries.insert_many(portfolio)
    print(f"  inserted {len(portfolio)} portfolio_entries")

    completed_at = datetime.now(timezone.utc) - timedelta(days=10)
    db.assignments.insert_one(
        {
            "user_id": DEMO_USER_ID,
            "status": "completed",
            "brief": "Use rule of thirds deliberately in your next portrait shoot — place the subject on a vertical third, not dead center.",
            "target_skill": "composition",
            "rationale": "Baseline portraits clustered near center (composition ~4.5). Post-assignment work shows stronger third placement.",
            "baseline_shoot_ids": [SHOOT_IDS[0]],
            "completion_shoot_ids": [SHOOT_IDS[1]],
            "skill_delta": {
                "metric": "Intentional Skill Application Rate",
                "baseline_value": 0.13,
                "current_value": 0.67,
                "delta": 0.54,
            },
            "created_at": completed_at - timedelta(days=14),
            "completed_at": completed_at,
        }
    )

    db.assignments.insert_one(
        {
            "user_id": DEMO_USER_ID,
            "status": "active",
            "brief": "Experiment with side lighting to add depth on your next craft or still-life shoot. Position key light 45° to the subject and leave one third of the frame as clean negative space.",
            "target_skill": "lighting",
            "rationale": "Lighting scores improved in shoot 3 but flat lays still lack dimensional separation. Side light + negative space builds on your textile work.",
            "baseline_shoot_ids": [SHOOT_IDS[2]],
            "completion_shoot_ids": [],
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "completed_at": None,
        }
    )
    print("  inserted 2 assignments (1 completed, 1 active)")

    db.aesthetic_profile.insert_one(
        {
            "user_id": DEMO_USER_ID,
            "dominant_tones": ["warm", "earth", "muted"],
            "preferred_lighting": ["soft natural", "side light"],
            "subject_patterns": ["craft", "still life", "portrait"],
            "stylistic_consistency_score": 0.72,
            "computed_at": datetime.now(timezone.utc),
            "computed_from_portfolio_size": len(portfolio),
        }
    )
    print("  inserted aesthetic_profile")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Practice Companion demo data")
    parser.add_argument("--reset", action="store_true", help="Delete demo user data first")
    args = parser.parse_args()

    if not URI:
        print("MONGODB_URI not set", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(URI, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    db = client[DB_NAME]

    print(f"Seeding database: {DB_NAME}")
    seed(db, reset=args.reset)
    print("\nAdd to .env:")
    print(f"  DEMO_USER_ID={DEMO_USER_HEX}")
    print("\nRestart make api-dev, then open Memory + Practice tabs.")


if __name__ == "__main__":
    main()
