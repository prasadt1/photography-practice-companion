"""Run v5 orchestrator via ADK Runner for Mentor Copilot chat (Phase 2)."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

# AgentTool sub-agents (skip_summarization returns prose in function_response.result)
_SUB_AGENT_TOOL_NAMES = frozenset(
    {
        "coach",
        "mentor",
        "planner",
        "reflection",
        "field_coach",
        "triage",
        "print_sales",
        "visual_describer",
    }
)

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agent import build_orchestrator_agent
from memory.users import get_persona, resolve_user_id

logger = logging.getLogger(__name__)

APP_NAME = "practice_companion_orchestrator"
_session_service = InMemorySessionService()
CHAT_TIMEOUT_SEC = 180


async def _ensure_session(user_id: str, session_id: str | None) -> tuple[str, str]:
    """Return (user_id, session_id) for Runner."""
    if session_id:
        existing = await _session_service.get_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )
        if existing:
            return user_id, existing.id

    session = await _session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
    )
    return user_id, session.id


def _resolve_chat_persona(
    user_id: str,
    *,
    persona_override: str | None = None,
) -> str:
    """Prefer explicit UI persona; keep MongoDB in sync."""
    if persona_override:
        from memory.users import set_persona

        set_persona(persona_override, user_id=user_id)
        return persona_override
    return get_persona(user_id)


def _format_agent_result_payload(raw: str) -> str:
    """Turn JSON planner payloads into readable chat text."""
    text = raw.strip()
    if not text:
        return ""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return text
    if not isinstance(data, dict):
        return text
    sections: list[str] = []
    for key in ("brief", "reply", "message", "summary"):
        val = data.get(key)
        if val:
            sections.append(str(val).strip())
    rationale = data.get("rationale")
    if rationale:
        sections.append(f"Why this fits you: {rationale}".strip())
    return "\n\n".join(sections) if sections else text


def _text_from_sub_agent_function_response(function_response: Any) -> str | None:
    """Extract assistant-visible text from AgentTool responses."""
    name = getattr(function_response, "name", None) or ""
    if name not in _SUB_AGENT_TOOL_NAMES:
        return None
    payload = getattr(function_response, "response", None)
    if not isinstance(payload, dict):
        return str(payload).strip() if payload else None
    result = payload.get("result")
    if result is None:
        return None
    if isinstance(result, str):
        return _format_agent_result_payload(result)
    return str(result).strip()


def _collect_reply_from_events(events: list[Any]) -> str:
    """Merge direct model text and sub-agent function_response results."""
    direct_text: list[str] = []
    sub_agent_text: list[str] = []

    for event in events:
        content = getattr(event, "content", None)
        if not content or not content.parts:
            continue
        for part in content.parts:
            if part.text and not getattr(part, "thought", False):
                direct_text.append(part.text)
            fr = getattr(part, "function_response", None)
            if fr:
                extracted = _text_from_sub_agent_function_response(fr)
                if extracted:
                    sub_agent_text.append(extracted)

    if sub_agent_text:
        return sub_agent_text[-1].strip()
    return "\n".join(direct_text).strip()


async def invoke_orchestrator_chat(
    message: str,
    *,
    user_id: str | None = None,
    session_id: str | None = None,
    persona: str | None = None,
) -> dict[str, Any]:
    """
    Send one user message to the persona-scoped orchestrator; return assistant reply text.
    """
    uid_oid = resolve_user_id(user_id)
    if uid_oid is None:
        raise ValueError("Set DEMO_USER_ID in .env or pass user_id for Mentor chat")
    uid = str(uid_oid)
    effective_persona = _resolve_chat_persona(uid, persona_override=persona)
    started = time.monotonic()
    logger.info("chat start persona=%s user=%s", effective_persona, uid)

    try:
        reply, sid = await asyncio.wait_for(
            _run_orchestrator_turn(
                message,
                uid=uid,
                session_id=session_id,
                persona=effective_persona,
            ),
            timeout=CHAT_TIMEOUT_SEC,
        )
    except asyncio.TimeoutError as exc:
        raise TimeoutError(
            f"Orchestrator exceeded {CHAT_TIMEOUT_SEC}s (working_pro + Print Sales can take 60–90s). "
            "Try again or use ADK playground Traces to debug."
        ) from exc
    finally:
        logger.info(
            "chat done persona=%s elapsed=%.1fs",
            effective_persona,
            time.monotonic() - started,
        )

    return {
        "reply": reply,
        "persona": effective_persona,
        "sessionId": sid,
        "userId": uid,
    }


async def _run_orchestrator_turn(
    message: str,
    *,
    uid: str,
    session_id: str | None,
    persona: str,
) -> tuple[str, str]:
    agent = build_orchestrator_agent(persona)
    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=_session_service,
    )

    uid, sid = await _ensure_session(uid, session_id)
    content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=message)],
    )

    events: list[Any] = []
    try:
        async for event in runner.run_async(
            user_id=uid,
            session_id=sid,
            new_message=content,
        ):
            events.append(event)
    finally:
        await runner.close()

    reply = _collect_reply_from_events(events) or (
        "I couldn't generate a reply. Try again or check API logs."
    )
    if reply.startswith("I couldn't generate"):
        logger.warning(
            "empty chat reply persona=%s events=%d (check sub-agent function_response)",
            persona,
            len(events),
        )
    return reply, sid
