#!/usr/bin/env bash
# Allow Cloud Run default SA to sign GCS URLs (Memory thumbnails for gs:// portfolio images).
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
NUMBER="$(gcloud projects describe "${PROJECT}" --format='value(projectNumber)')"

# Cloud Run service runtime identity (default when --service-account not set on deploy).
RUN_SA="${CLOUD_RUN_RUNTIME_SA:-${NUMBER}-compute@developer.gserviceaccount.com}"

echo "Granting roles/iam.serviceAccountTokenCreator to ${RUN_SA} (signBlob for GCS v4 URLs)..."

gcloud iam service-accounts add-iam-policy-binding "${RUN_SA}" \
  --project="${PROJECT}" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --quiet

echo "Done. Redeploy or wait ~1 min, then refresh Memory tab."
