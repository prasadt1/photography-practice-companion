"""Expand NL library search queries into metadata search terms via Gemini."""

from __future__ import annotations

import json
import os
import re
from functools import lru_cache

from google import genai
from google.genai import types


def _gemini_client() -> genai.Client:
    return genai.Client(
        vertexai=True,
        project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
        location=os.environ.get(
            "VERTEX_AI_GEMINI_LOCATION",
            os.environ.get("GEMINI_VERTEX_REGION", "global"),
        ),
    )


def _search_expand_model() -> str:
    return os.environ.get(
        "SEARCH_EXPAND_MODEL",
        os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview"),
    )


def _search_expand_enabled() -> bool:
    return os.environ.get("SEARCH_EXPAND_QUERIES", "true").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


def _normalize_terms(raw: list[str], *, original: str) -> list[str]:
    seen: set[str] = set()
    terms: list[str] = []
    for item in [original, *raw]:
        term = re.sub(r"\s+", " ", (item or "").strip())
        if not term:
            continue
        key = term.lower()
        if key in seen:
            continue
        seen.add(key)
        terms.append(term)
    return terms


@lru_cache(maxsize=256)
def expand_library_search_terms(query: str) -> tuple[str, ...]:
    """
    Turn a short NL query into search terms for scene descriptions and tags.

    Uses Gemini (not a hard-coded synonym table) so queries like "tiger" can
    surface photos described as "lion" or "safari wildlife".
    """
    original = query.strip()
    if not original:
        return tuple()
    if not _search_expand_enabled():
        return (original,)

    prompt = (
        "You help search a personal photography library by scene descriptions and tags.\n"
        f'User query: "{original}"\n\n'
        "Return JSON only:\n"
        '{"terms":["...", "..."]}\n\n'
        "Rules:\n"
        "- Include the original query when relevant.\n"
        "- Add sibling subjects the user may mean (tiger → lion, leopard; car → van, camper, RV, truck).\n"
        "- Add concrete words likely to appear in photo descriptions or tags.\n"
        "- 6–12 short terms, lowercase except proper nouns.\n"
        "- No sentences, no explanations."
    )

    try:
        client = _gemini_client()
        response = client.models.generate_content(
            model=_search_expand_model(),
            contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        text = (response.text or "").strip()
        payload = json.loads(text)
        raw_terms = payload.get("terms") if isinstance(payload, dict) else None
        if not isinstance(raw_terms, list):
            return (original,)
        cleaned = [str(t).strip() for t in raw_terms if str(t).strip()]
        terms = _normalize_terms(cleaned, original=original)
        return tuple(terms) if terms else (original,)
    except Exception as exc:
        print(f"[search] query expansion skipped: {exc}")
        return (original,)
