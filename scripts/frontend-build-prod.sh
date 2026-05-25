#!/usr/bin/env bash
# Production frontend build with API + optional Firebase Auth env from .env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_URL="${API_URL:-}"
if [[ -z "${API_URL}" ]]; then
  echo "ERROR: Set API_URL=https://your-cloud-run-url" >&2
  exit 1
fi

load_var() {
  python3 - "$1" <<'PY'
import os, sys
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(".env"))
print(os.getenv(sys.argv[1], "").strip())
PY
}

export VITE_API_BASE_URL="${API_URL}"
export VITE_USE_MOCK=false
export VITE_FIREBASE_API_KEY="$(load_var VITE_FIREBASE_API_KEY)"
export VITE_FIREBASE_AUTH_DOMAIN="$(load_var VITE_FIREBASE_AUTH_DOMAIN)"
export VITE_FIREBASE_PROJECT_ID="$(load_var VITE_FIREBASE_PROJECT_ID)"

if [[ -n "${VITE_FIREBASE_API_KEY}" ]]; then
  echo "Firebase Auth: enabled for hosting build"
else
  echo "Firebase Auth: not configured (demo user only until VITE_FIREBASE_* in .env)"
fi

cd frontend && npm run build
