#!/usr/bin/env python3
"""
Debounced MongoDB change stream listener — recomputes aesthetic_profile on portfolio writes.

Run locally:
  cd app && uv run python ../services/change-stream-listener/main.py

Deploy: Cloud Run job or long-running service — see docs/deploy.md § Change streams.
"""

from __future__ import annotations

import logging
import os
import sys
import threading
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
# Local dev: load repo .env. Cloud Run injects MONGODB_URI via env-vars-file.
_env_file = REPO_ROOT / ".env"
if _env_file.is_file():
    try:
        from dotenv import load_dotenv

        load_dotenv(_env_file)
    except ImportError:
        pass
sys.path.insert(0, "/app")
if str(REPO_ROOT / "app") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "app"))

from bson import ObjectId  # noqa: E402

from memory.aesthetic_profile import upsert_aesthetic_profile  # noqa: E402
from memory.db import get_db  # noqa: E402

logger = logging.getLogger(__name__)
DEBOUNCE_SEC = float(os.environ.get("CHANGE_STREAM_DEBOUNCE_SEC", "2.0"))


class _Debouncer:
    def __init__(self) -> None:
        self._pending: dict[str, float] = {}
        self._lock = threading.Lock()
        self._stop = threading.Event()

    def schedule(self, user_hex: str) -> None:
        with self._lock:
            self._pending[user_hex] = time.monotonic() + DEBOUNCE_SEC

    def run(self) -> None:
        while not self._stop.is_set():
            due: list[str] = []
            now = time.monotonic()
            with self._lock:
                for uid, deadline in list(self._pending.items()):
                    if now >= deadline:
                        due.append(uid)
                        del self._pending[uid]
            for uid in due:
                try:
                    upsert_aesthetic_profile(user_id=uid)
                    logger.info("aesthetic_profile updated for user %s", uid)
                except Exception as exc:
                    logger.exception("profile recompute failed for %s: %s", uid, exc)
            time.sleep(0.25)

    def stop(self) -> None:
        self._stop.set()


def _user_id_from_change(change: dict) -> str | None:
    doc = change.get("fullDocument") or {}
    uid = doc.get("user_id")
    if uid is None and change.get("documentKey"):
        key = change["documentKey"].get("_id")
        if key:
            row = get_db().portfolio_entries.find_one(
                {"_id": ObjectId(key)},
                projection={"user_id": 1},
            )
            uid = row.get("user_id") if row else None
    if uid is None:
        return None
    return str(uid)


def watch_portfolio_changes() -> None:
    coll = get_db().portfolio_entries
    debouncer = _Debouncer()
    worker = threading.Thread(target=debouncer.run, daemon=True)
    worker.start()

    pipeline = [
        {
            "$match": {
                "operationType": {"$in": ["insert", "update", "replace"]},
            }
        }
    ]
    logger.info("Listening on portfolio_entries change stream (debounce=%ss)", DEBOUNCE_SEC)
    with coll.watch(pipeline, full_document="updateLookup") as stream:
        for change in stream:
            uid = _user_id_from_change(change)
            if uid:
                debouncer.schedule(uid)


def start_health_server() -> None:
    """Cloud Run requires a process listening on PORT (default 8080)."""
    import http.server
    import socketserver

    port = int(os.environ.get("PORT", "8080"))

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            if self.path in ("/", "/health"):
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(b"ok")
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, *_args: object) -> None:
            return

    httpd = socketserver.TCPServer(("0.0.0.0", port), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    logger.info("Health server listening on 0.0.0.0:%s", port)


def _run_stream_with_retry() -> None:
    while True:
        try:
            watch_portfolio_changes()
        except Exception:
            logger.exception("change stream ended; retrying in 10s")
            time.sleep(10)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_health_server()
    threading.Thread(target=_run_stream_with_retry, daemon=True).start()
    while True:
        time.sleep(3600)
