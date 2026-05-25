"""Map external auth ids (Firebase uid) to stable MongoDB ObjectIds."""

from __future__ import annotations

import hashlib

from bson import ObjectId
from bson.errors import InvalidId


def to_mongo_user_id(user_id: str) -> ObjectId:
    """Accept 24-char hex demo ids; hash Firebase/Google uids to a stable ObjectId."""
    try:
        return ObjectId(user_id)
    except (InvalidId, TypeError):
        digest = hashlib.sha256(user_id.encode("utf-8")).digest()[:12]
        return ObjectId(digest)
