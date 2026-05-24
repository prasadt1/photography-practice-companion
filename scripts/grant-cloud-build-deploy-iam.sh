#!/usr/bin/env bash
# One-time IAM for `gcloud run deploy --source` (Cloud Build + run-sources bucket).
# Run as a project Owner (your user), not the runtime service account.
set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
REGION="${CLOUD_RUN_REGION:-us-central1}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud not found" >&2
  exit 1
fi

ACTIVE="$(gcloud config get-value account 2>/dev/null || true)"
if [[ "${ACTIVE}" == *"gserviceaccount.com" ]]; then
  echo "ERROR: use your user account, not ${ACTIVE}" >&2
  echo "  gcloud config set account YOUR_EMAIL@gmail.com" >&2
  exit 1
fi

NUMBER="$(gcloud projects describe "${PROJECT}" --format='value(projectNumber)')"
COMPUTE_SA="${NUMBER}-compute@developer.gserviceaccount.com"
CLOUDBUILD_SA="${NUMBER}@cloudbuild.gserviceaccount.com"

echo "Project: ${PROJECT} (${NUMBER})"
echo "Granting Cloud Run source-deploy roles to default build identities..."
echo ""

grant() {
  local member="$1"
  local role="$2"
  echo "  ${role} → ${member}"
  gcloud projects add-iam-policy-binding "${PROJECT}" \
    --member="serviceAccount:${member}" \
    --role="${role}" \
    --condition=None \
    >/dev/null
}

# Required for gcloud run deploy --source (reads run-sources-* bucket, pushes image).
grant "${COMPUTE_SA}" "roles/run.builder"
grant "${COMPUTE_SA}" "roles/storage.objectViewer"
grant "${COMPUTE_SA}" "roles/artifactregistry.writer"
grant "${COMPUTE_SA}" "roles/logging.logWriter"

# Legacy Cloud Build SA (some orgs still use it for triggers).
grant "${CLOUDBUILD_SA}" "roles/cloudbuild.builds.builder" || true

echo ""
echo "Done. IAM can take 1–2 minutes to propagate."
echo "Then: ./scripts/deploy-coach-api.sh"
