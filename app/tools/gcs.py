"""Upload portfolio images to GCS (ADR-002)."""

from __future__ import annotations

import logging
import os
import uuid
from datetime import timedelta

import google.auth
from google.auth.transport import requests as auth_requests
from google.cloud import storage

logger = logging.getLogger(__name__)


def upload_portfolio_image(
    image_bytes: bytes,
    content_type: str,
    user_id: str,
    shoot_id: str,
) -> str:
    bucket_name = os.environ.get("GCS_PORTFOLIO_BUCKET", "practice-companion-portfolio")
    prefix = os.environ.get("GCS_PORTFOLIO_PREFIX", "originals").strip("/")
    ext = "jpg" if "jpeg" in content_type or content_type == "image/jpg" else "png"
    object_name = f"{prefix}/{user_id}/{shoot_id}/{uuid.uuid4().hex}.{ext}"

    client = storage.Client(project=os.environ.get("GOOGLE_CLOUD_PROJECT"))
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_string(image_bytes, content_type=content_type)
    return f"gs://{bucket_name}/{object_name}"


def _credentials_for_signing():
    credentials, project = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    auth_request = auth_requests.Request()
    credentials.refresh(auth_request)
    return credentials, project


def signed_https_url(gs_uri: str, minutes: int | None = None) -> str:
    """Return a time-limited HTTPS URL for a gs:// object (works on Cloud Run via IAM signBlob)."""
    if not gs_uri.startswith("gs://"):
        return gs_uri
    _, rest = gs_uri.split("gs://", 1)
    bucket_name, object_name = rest.split("/", 1)
    if minutes is None:
        minutes = int(os.environ.get("GCS_SIGNED_URL_MINUTES", "360"))

    credentials, project = _credentials_for_signing()
    client = storage.Client(credentials=credentials, project=project)
    blob = client.bucket(bucket_name).blob(object_name)
    expiration = timedelta(minutes=minutes)
    method = "GET"

    # JSON key (local dev): sign with embedded private key.
    if getattr(credentials, "signer", None) is not None:
        return blob.generate_signed_url(
            version="v4",
            expiration=expiration,
            method=method,
        )

    # Cloud Run / GCE metadata credentials: IAM signBlob.
    service_account_email = getattr(credentials, "service_account_email", None)
    if not service_account_email:
        raise RuntimeError("Cannot resolve service account email for signed URL")

    return blob.generate_signed_url(
        version="v4",
        expiration=expiration,
        method=method,
        service_account_email=service_account_email,
        access_token=credentials.token,
    )
