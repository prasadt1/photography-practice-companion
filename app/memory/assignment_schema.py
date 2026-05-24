"""Assignment models (spec §7.2)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SkillDelta(BaseModel):
    metric: str = "Intentional Skill Application Rate"
    baseline_value: float
    current_value: float
    delta: float


class PlannerAssignmentOutput(BaseModel):
    brief: str
    target_skill: str
    rationale: str


class AssignmentCreate(BaseModel):
    user_id: str
    brief: str
    target_skill: str
    rationale: str
    baseline_shoot_ids: list[str] = Field(default_factory=list)
    status: Literal["proposed", "active"] = "proposed"


class AssignmentRecord(BaseModel):
    id: str
    userId: str
    status: Literal["proposed", "active", "completed", "abandoned"]
    brief: str
    targetSkill: str
    rationale: str
    baselineShootIds: list[str]
    completionShootIds: list[str]
    skillDelta: SkillDelta | None = None
    createdAt: str
    completedAt: str | None = None
