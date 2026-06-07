"""FastAPI server — Studio (Coach) + Mentor Copilot orchestrator chat (Phase 2)."""

from __future__ import annotations

import logging
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

_creds_rel = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if _creds_rel:
    _cp = Path(_creds_rel)
    if not _cp.is_absolute():
        _cp = PROJECT_ROOT / _creds_rel.lstrip("./")
    if _cp.is_file():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(_cp.resolve())

from api.orchestrator_service import invoke_orchestrator_chat, invoke_triage_backlog  # noqa: E402
from sub_agents.coach import analyze_photo  # noqa: E402
from memory.assignments import (  # noqa: E402
    accept_assignment,
    complete_assignment,
    decline_assignment,
    get_active_assignment,
    get_assignment,
    list_assignments,
    propose_assignment,
)
from api.mentor_suggestions import suggest_mentor_questions  # noqa: E402
from memory.portfolio import (  # noqa: E402
    compute_aesthetic_summary,
    delete_portfolio_entries,
    delete_portfolio_entry,
    get_portfolio_entry,
    get_portfolio_stats,
    list_portfolio_by_shoot_ids,
    list_portfolio_entries,
)
from memory.trends import compute_portfolio_trends  # noqa: E402
from memory.pending_approvals import apply_decision, list_decided, list_pending  # noqa: E402
from memory.users import get_user_profile, set_persona  # noqa: E402
from api.triage_scan import run_triage_scan  # noqa: E402
from api.print_sales_scan import run_print_sales_scan  # noqa: E402
from api.portfolio_insights import (  # noqa: E402
    get_similar_portfolio_photos,
    search_portfolio_library,
)
from memory.print_sales_list import list_print_sales  # noqa: E402
from api.field_capture_service import analyze_field_frame  # noqa: E402
from memory.capture_sessions import create_capture_session, end_capture_session  # noqa: E402
from memory.session_context import set_request_user_id  # noqa: E402


class UserScopeMiddleware(BaseHTTPMiddleware):
    """Propagate X-User-Id / userId query into session context for multi-tenant reads."""

    async def dispatch(self, request: Request, call_next):
        uid = request.headers.get("X-User-Id") or request.query_params.get("userId")
        set_request_user_id(uid)
        return await call_next(request)


app = FastAPI(title="Practice Companion API", version="0.5.0")
app.add_middleware(UserScopeMiddleware)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    session_id: str | None = Field(default=None, alias="sessionId")
    user_id: str | None = Field(default=None, alias="userId")
    # UI persona wins over stale DB (Phase 2 bugfix: toggle without persisted persona)
    persona: Literal["hobbyist", "working_pro", "vision_impairment"] | None = None

    model_config = {"populate_by_name": True}


class PersonaUpdate(BaseModel):
    persona: Literal["hobbyist", "working_pro", "vision_impairment"]
    user_id: str | None = Field(default=None, alias="userId")

    model_config = {"populate_by_name": True}


class ApprovalDecision(BaseModel):
    action: Literal["approve", "reject", "modify"]
    override_payload: dict | None = Field(default=None, alias="overridePayload")
    user_id: str | None = Field(default=None, alias="userId")

    model_config = {"populate_by_name": True}


class PortfolioBatchDelete(BaseModel):
    entry_ids: list[str] = Field(alias="entryIds")
    user_id: str | None = Field(default=None, alias="userId")
    remove_listing: bool = Field(default=False, alias="removeListing")

    model_config = {"populate_by_name": True}


class CaptureSessionCreate(BaseModel):
    location_description: str = Field(default="", alias="locationDescription")
    assignment_id: str | None = Field(default=None, alias="assignmentId")
    persona: Literal["hobbyist", "working_pro", "vision_impairment"] = "hobbyist"
    user_id: str | None = Field(default=None, alias="userId")

    model_config = {"populate_by_name": True}

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    mcp_enabled = os.environ.get("ORCHESTRATOR_USE_MCP", "true").lower() not in (
        "0",
        "false",
        "no",
    )
    mcp_url = os.environ.get("MONGODB_MCP_HTTP_URL", "")
    return {
        "status": "ok",
        "phase": "4",
        "orchestratorChat": "enabled",
        "triageHitl": "enabled",
        "printSalesHitl": "enabled",
        "fieldCapture": "enabled",
        "mentorMcpReads": "enabled",
        "mentorMcpToolset": "enabled" if mcp_enabled else "disabled",
        "mongodbMcpHttp": mcp_url or "stdio",
    }


@app.get("/api/v1/users/me")
def users_me(user_id: str | None = None) -> dict:
    try:
        return get_user_profile(user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.patch("/api/v1/users/me")
def users_me_patch(body: PersonaUpdate) -> dict:
    try:
        return set_persona(body.persona, user_id=body.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/agent/chat")
async def agent_chat(body: ChatRequest) -> dict:
    try:
        return await invoke_orchestrator_chat(
            body.message,
            user_id=body.user_id,
            session_id=body.session_id,
            persona=body.persona,
        )
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/pending-approvals/history")
def pending_approvals_history(
    user_id: str | None = None,
    agent_name: str | None = None,
    limit: int = 50,
) -> dict:
    try:
        return list_decided(user_id=user_id, agent_name=agent_name, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/pending-approvals")
def pending_approvals_list(
    user_id: str | None = None,
    status: str | None = "pending",
    agent_name: str | None = None,
) -> dict:
    try:
        return list_pending(user_id=user_id, status=status, agent_name=agent_name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.patch("/api/v1/pending-approvals/{approval_id}")
def pending_approvals_decide(approval_id: str, body: ApprovalDecision) -> dict:
    try:
        return apply_decision(
            approval_id,
            body.action,
            override_payload=body.override_payload,
            user_id=body.user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/triage/backlog")
async def triage_backlog(
    user_id: str | None = None,
    persona: Literal["hobbyist", "working_pro"] = "hobbyist",
) -> dict:
    """Invoke Backlog Triage sub-agent via orchestrator (LLM path; HITL for writes)."""
    try:
        return await invoke_triage_backlog(user_id=user_id, persona=persona)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/triage/scan")
def triage_scan(user_id: str | None = None) -> dict:
    """Run Triage analysis and create HITL proposals (fast path for web demo)."""
    try:
        return run_triage_scan(user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/print-sales")
def print_sales_list(user_id: str | None = None, limit: int = 50) -> dict:
    """Saved listings after user approval (not live on Etsy in this preview)."""
    try:
        return list_print_sales(user_id=user_id, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/print-sales/scan")
def print_sales_scan(user_id: str | None = None, marketplace: str = "etsy") -> dict:
    """Create Print Sales HITL listing proposals (fast path for web demo)."""
    try:
        return run_print_sales_scan(user_id=user_id, marketplace=marketplace)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


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
def portfolio_list(
    user_id: str | None = None,
    limit: int = 48,
    sort_by: str = "date",
    sort_order: str = "desc",
    user_tag: str | None = None,
) -> dict:
    try:
        return list_portfolio_entries(
            user_id=user_id,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            user_tag=user_tag,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/portfolio/search")
def portfolio_search(
    q: str,
    user_id: str | None = None,
    limit: int = 8,
) -> dict:
    try:
        return search_portfolio_library(q, user_id=user_id, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/portfolio/by-shoots")
def portfolio_by_shoots(
    shoot_ids: str,
    user_id: str | None = None,
) -> dict:
    """Resolve portfolio entries for comma-separated shoot ids (assignment compare)."""
    try:
        ids = [s.strip() for s in shoot_ids.split(",") if s.strip()]
        return list_portfolio_by_shoot_ids(ids, user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/portfolio/delete-batch")
def portfolio_delete_batch(body: PortfolioBatchDelete) -> dict:
    try:
        return delete_portfolio_entries(
            body.entry_ids,
            user_id=body.user_id,
            remove_listing=body.remove_listing,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/portfolio/stats")
def portfolio_stats(user_id: str | None = None) -> dict:
    try:
        return get_portfolio_stats(user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/portfolio/trends")
def portfolio_trends(user_id: str | None = None, limit: int = 12) -> dict:
    try:
        return compute_portfolio_trends(user_id=user_id, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.delete("/api/v1/portfolio/{entry_id}")
def portfolio_delete(
    entry_id: str,
    user_id: str | None = None,
    remove_listing: bool = Query(False, alias="removeListing"),
) -> dict:
    try:
        return delete_portfolio_entry(
            entry_id,
            user_id=user_id,
            remove_listing=remove_listing,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/portfolio/{entry_id}")
def portfolio_get(entry_id: str, user_id: str | None = None) -> dict:
    try:
        return get_portfolio_entry(entry_id, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/portfolio/{entry_id}/similar")
def portfolio_similar(
    entry_id: str,
    user_id: str | None = None,
    limit: int = 4,
) -> dict:
    try:
        return get_similar_portfolio_photos(entry_id, user_id=user_id, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/aesthetic-profile")
def aesthetic_profile(user_id: str | None = None) -> dict:
    try:
        from memory.aesthetic_profile import upsert_aesthetic_profile
        from memory.session_context import resolve_effective_user_id

        effective = resolve_effective_user_id(user_id)
        if effective:
            return upsert_aesthetic_profile(user_id=effective)
        return compute_aesthetic_summary(user_id=user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/mentor/suggested-questions")
def mentor_suggested_questions(
    persona: Literal["hobbyist", "working_pro"] = "hobbyist",
    user_id: str | None = None,
) -> dict:
    try:
        return suggest_mentor_questions(persona=persona, user_id=user_id)
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
def assignments_propose(
    user_id: str | None = None,
    mode: str = "hobbyist",
    focus_skill: str | None = None,
) -> dict:
    try:
        return propose_assignment(user_id=user_id, mode=mode, focus_skill=focus_skill)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/assignments/{assignment_id}")
def assignments_get(assignment_id: str, user_id: str | None = None) -> dict:
    try:
        return get_assignment(assignment_id, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
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


@app.post("/api/v1/capture_sessions")
def capture_sessions_create(body: CaptureSessionCreate) -> dict:
    try:
        return create_capture_session(
            user_id=body.user_id,
            location_description=body.location_description,
            assignment_id=body.assignment_id,
            persona=body.persona,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/capture_sessions/{session_id}/end")
def capture_sessions_end(session_id: str, user_id: str | None = None) -> dict:
    try:
        return end_capture_session(session_id, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/agent/field_capture")
async def agent_field_capture(
    image: UploadFile = File(...),
    session_id: str = Form(..., alias="sessionId"),
    user_id: str | None = Form(None),
    persona: Literal["hobbyist", "working_pro", "vision_impairment"] = Form("hobbyist"),
    assignment_brief: str | None = Form(None, alias="assignmentBrief"),
) -> dict:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    data = await image.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Frame too large (max 5MB)")

    try:
        return analyze_field_frame(
            image_bytes=data,
            content_type=image.content_type,
            session_id=session_id,
            user_id=user_id,
            persona=persona,
            assignment_brief=assignment_brief,
        )
    except ValueError as exc:
        raise HTTPException(status_code=429 if "Rate limited" in str(exc) else 400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
