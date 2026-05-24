"""FastAPI server — Studio photo analysis via Coach sub-agent."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

from coach.service import analyze_photo  # noqa: E402
from memory.assignments import (  # noqa: E402
    accept_assignment,
    complete_assignment,
    decline_assignment,
    get_active_assignment,
    list_assignments,
    propose_assignment,
)
from memory.portfolio import compute_aesthetic_summary, list_portfolio_entries  # noqa: E402

app = FastAPI(title="Practice Companion API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "phase": "3"}


@app.post("/api/v1/analyze-photo")
async def analyze_photo_endpoint(
    image: UploadFile = File(...),
    user_id: str | None = Form(None),
    shoot_id: str | None = Form(None),
    assignment_id: str | None = Form(None),
) -> dict:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    data = await image.read()
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 20MB)")

    try:
        return analyze_photo(
            image_bytes=data,
            content_type=image.content_type,
            filename=image.filename or "photo.jpg",
            user_id=user_id,
            shoot_id=shoot_id,
            assignment_id=assignment_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/portfolio")
def portfolio_list(user_id: str | None = None, limit: int = 48) -> dict:
    try:
        return list_portfolio_entries(user_id=user_id, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/aesthetic-profile")
def aesthetic_profile(user_id: str | None = None) -> dict:
    try:
        return compute_aesthetic_summary(user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/assignments/active")
def assignments_active(user_id: str | None = None) -> dict:
    try:
        active = get_active_assignment(user_id=user_id)
        return {"active": active}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/assignments")
def assignments_list(user_id: str | None = None) -> dict:
    try:
        return list_assignments(user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/assignments/propose")
def assignments_propose(user_id: str | None = None, mode: str = "hobbyist") -> dict:
    try:
        return propose_assignment(user_id=user_id, mode=mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/assignments/{assignment_id}/accept")
def assignments_accept(assignment_id: str, user_id: str | None = None) -> dict:
    try:
        return accept_assignment(assignment_id, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/assignments/{assignment_id}/decline")
def assignments_decline(assignment_id: str) -> dict:
    try:
        return decline_assignment(assignment_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/assignments/{assignment_id}/complete")
def assignments_complete(assignment_id: str) -> dict:
    try:
        return complete_assignment(assignment_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
