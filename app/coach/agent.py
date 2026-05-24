"""ADK Coach agent — wraps analyze_photo for orchestrator AgentTool (Phase 2)."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

gemini_location = os.getenv("VERTEX_AI_GEMINI_LOCATION", "global")
os.environ["GOOGLE_CLOUD_LOCATION"] = gemini_location
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

prompt = (Path(__file__).parent.parent / "prompts" / "coach.txt").read_text()

coach_agent = Agent(
    name="practice_companion_coach",
    model=Gemini(
        model=os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview"),
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=prompt,
    tools=[],
)
