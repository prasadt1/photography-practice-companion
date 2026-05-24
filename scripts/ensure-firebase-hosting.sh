#!/usr/bin/env bash
# Verify Firebase Hosting is ready before `firebase deploy --only hosting`.
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"

if ! command -v firebase >/dev/null 2>&1; then
  echo "ERROR: firebase CLI not found. Run: npm install -g firebase-tools && firebase login" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 required for Firebase preflight" >&2
  exit 1
fi

IFS='|' read -r FIREBASE_OK SITE_ID DEPLOY_URL _ <<<"$(python3 - <<PY
import json
import subprocess
import sys

project = "${PROJECT}"

def run(*args):
    return subprocess.run(
        ["firebase", *args, "--json"],
        capture_output=True,
        text=True,
    )

# Hosting sites (authoritative for deploy)
sites_proc = run("hosting:sites:list", "--project", project)
if sites_proc.returncode != 0:
    err = (sites_proc.stderr or sites_proc.stdout or "").strip()
    print(f"error| | |{err[:200]}")
    sys.exit(0)

try:
    sites_data = json.loads(sites_proc.stdout)
except json.JSONDecodeError:
    print("error| | |invalid JSON from firebase hosting:sites:list")
    sys.exit(0)

sites = (sites_data.get("result") or {}).get("sites") or []
if sites:
    site = sites[0]
    site_id = site.get("name", "").split("/")[-1] or project
    url = site.get("defaultUrl", "")
    print(f"ok|{site_id}|{url}|")
    sys.exit(0)

# No sites — check whether Firebase project exists at all
proj_proc = run("projects:list")
firebase_project = False
if proj_proc.returncode == 0:
    try:
        proj_data = json.loads(proj_proc.stdout)
        ids = [p.get("projectId") for p in (proj_data.get("result") or [])]
        firebase_project = project in ids
    except json.JSONDecodeError:
        pass

if firebase_project:
    print("no_site| | |")
else:
    print("no_firebase| | |")
PY
)"

case "${FIREBASE_OK}" in
  ok)
    echo "Firebase Hosting OK: site=${SITE_ID} url=${DEPLOY_URL}"
    ;;
  no_site)
    echo "ERROR: Firebase project exists but no Hosting site yet." >&2
    echo "" >&2
    echo "Firebase console → Build → Hosting → Get started" >&2
    echo "Or: firebase hosting:sites:create ${PROJECT} --project ${PROJECT}" >&2
    exit 1
    ;;
  no_firebase)
    echo "ERROR: '${PROJECT}' is not a Firebase project (CLI cannot see it)." >&2
    echo "" >&2
    echo "If you finished setup in the browser, refresh CLI auth:" >&2
    echo "  firebase login --reauth" >&2
    echo "  firebase use ${PROJECT}" >&2
    echo "  firebase projects:list   # should list ${PROJECT}" >&2
    echo "" >&2
    echo "Otherwise: console.firebase.google.com → add Firebase to GCP project ${PROJECT}" >&2
    exit 1
    ;;
  error)
    echo "ERROR: firebase CLI failed: ${DEPLOY_URL}" >&2
    echo "Try: firebase login --reauth" >&2
    exit 1
    ;;
  *)
    echo "ERROR: unexpected preflight result" >&2
    exit 1
    ;;
esac
