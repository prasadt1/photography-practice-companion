"""Atlas Vector Search / Atlas Search feature flags (consolidation item 11)."""

from __future__ import annotations

import os


def require_atlas_features() -> bool:
    return os.environ.get("MONGODB_REQUIRE_ATLAS_FEATURES", "").lower() in (
        "1",
        "true",
        "yes",
    )


def atlas_fallback_allowed() -> bool:
    return not require_atlas_features()
