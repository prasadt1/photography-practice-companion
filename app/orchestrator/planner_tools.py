"""Planner / assignment tools exposed to orchestrator."""

from __future__ import annotations

from memory.assignments import propose_assignment


def suggest_practice_assignment(mode: str = "hobbyist") -> dict:
    """
    Generate a proposed practice assignment from recent portfolio (HITL — user must Accept in UI).
    mode: hobbyist | working_pro
    """
    if mode not in ("hobbyist", "working_pro"):
        mode = "hobbyist"
    return propose_assignment(mode=mode)
