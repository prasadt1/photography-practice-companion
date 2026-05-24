"""Agent Builder principles search for orchestrator."""

from __future__ import annotations

from tools.grounding import SCENE_TO_DOCS, _load_local, _search_discovery_engine


def search_photography_principles(query: str, limit: int = 5) -> dict:
    """
    Search curated photography principles (Agent Builder Data Store, then local markdown).
    Use for questions like rule of thirds, lighting direction, composition.
    """
    q = query.strip()
    if not q:
        return {"principles": [], "message": "Provide a search query."}

    citations = _search_discovery_engine(q, page_size=limit)
    source = "discovery_engine"
    if not citations:
        source = "local_principles"
        keys = [k for k, docs in SCENE_TO_DOCS.items() if q.lower() in k or any(q.lower() in d for d in docs)]
        doc_ids = SCENE_TO_DOCS.get(keys[0] if keys else "general", SCENE_TO_DOCS["general"])
        citations = [c for d in doc_ids if (c := _load_local(d))]

    return {
        "query": q,
        "source": source,
        "principles": [
            {"id": c.id, "title": c.title, "excerpt": c.excerpt}
            for c in citations[:limit]
        ],
    }
