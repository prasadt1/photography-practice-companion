#!/usr/bin/env bash
# Write VITE_FIREBASE_* into .env from the Firebase web app SDK config (idempotent).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_ID="${FIREBASE_WEB_APP_ID:-1:975418990849:web:bff936cd5114b0b717fb00}"
PROJECT="${FIREBASE_PROJECT:-practice-companion-hackathon}"

echo "Fetching SDK config for WEB app $APP_ID …"
CONFIG_JSON="$(firebase apps:sdkconfig WEB "$APP_ID" --project "$PROJECT" 2>/dev/null | tail -n +1)"
# firebase may print progress lines; take last JSON object line block
CONFIG_JSON="$(echo "$CONFIG_JSON" | python3 -c "
import sys, json, re
text = sys.stdin.read()
# find last { ... } block
m = list(re.finditer(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL))
if not m:
    raise SystemExit('Could not parse firebase apps:sdkconfig output')
print(m[-1].group(0))
")"

python3 - "$CONFIG_JSON" <<'PY'
import json, os, re, sys
from pathlib import Path

cfg = json.loads(sys.argv[1])
updates = {
    "VITE_FIREBASE_API_KEY": cfg["apiKey"],
    "VITE_FIREBASE_AUTH_DOMAIN": cfg["authDomain"],
    "VITE_FIREBASE_PROJECT_ID": cfg["projectId"],
}
env_path = Path(".env")
lines = env_path.read_text().splitlines() if env_path.exists() else []
out = []
seen = set()
for line in lines:
    m = re.match(r"^(VITE_FIREBASE_[A-Z_]+)=", line)
    if m:
        key = m.group(1)
        if key in updates:
            out.append(f"{key}={updates[key]}")
            seen.add(key)
            continue
    out.append(line)
for key, val in updates.items():
    if key not in seen:
        out.append(f"{key}={val}")
env_path.write_text("\n".join(out) + "\n")
print("Updated .env:")
for k in updates:
    print(f"  {k}=<set>")
PY

echo "Next: enable Google sign-in in Firebase Console → Authentication → Sign-in method → Google → Enable."
echo "Then: API_URL=https://YOUR-RUN-URL make deploy-hosting"
