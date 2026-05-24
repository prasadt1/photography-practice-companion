#!/usr/bin/env bash
# Create portfolio bucket per ADR-002 / spec. Run from repo root.
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
BUCKET="${GCS_PORTFOLIO_BUCKET:-practice-companion-portfolio}"
REGION="${GCS_PORTFOLIO_REGION:-us-central1}"

if gsutil ls -b "gs://${BUCKET}" >/dev/null 2>&1; then
  echo "Bucket gs://${BUCKET} already exists."
  gcloud storage buckets describe "gs://${BUCKET}" --format="table(name,location,storageClass)"
  exit 0
fi

echo "Creating gs://${BUCKET} in ${REGION} (project ${PROJECT})..."
gcloud storage buckets create "gs://${BUCKET}" \
  --project="${PROJECT}" \
  --location="${REGION}" \
  --uniform-bucket-level-access

echo "Done. Set in .env: GCS_PORTFOLIO_BUCKET=${BUCKET}"
