# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Practice Companion Orchestrator Agent

Phase 2: MongoDB MCP (optional) + memory/principles FunctionTools + Coach upload tool.
"""

import os
from pathlib import Path

import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types
from dotenv import load_dotenv

from orchestrator.tool_registry import build_orchestrator_tools

# Load environment variables from .env file (look in parent directory if not found)
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)

creds_rel = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if creds_rel:
    creds_path = Path(creds_rel)
    if not creds_path.is_absolute():
        creds_path = project_root / creds_rel.lstrip("./")
    if creds_path.is_file():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_path.resolve())

# Set up GCP environment
# Use application default credentials (already authenticated via gcloud)
try:
    _, project_id = google.auth.default()
except Exception:
    # Fallback to env var if ADC not available
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "practice-companion-hackathon")

os.environ["GOOGLE_CLOUD_PROJECT"] = project_id

# Gemini 3.x uses the global Vertex endpoint (ADR-010). Embeddings stay regional.
gemini_location = os.getenv(
    "VERTEX_AI_GEMINI_LOCATION",
    os.getenv("GEMINI_VERTEX_REGION", "global"),
)
os.environ["GOOGLE_CLOUD_LOCATION"] = gemini_location
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

# Default: Gemini 3.1 Pro preview (successor to gemini-3-pro-preview on Vertex)
gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")

# Load orchestrator instruction from prompts/orchestrator.txt
prompts_dir = Path(__file__).parent.parent / "prompts"
orchestrator_instruction = (prompts_dir / "orchestrator.txt").read_text()

# Practice Companion Orchestrator
root_agent = Agent(
    name="practice_companion_orchestrator",
    model=Gemini(
        model=gemini_model,
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=orchestrator_instruction,
    tools=build_orchestrator_tools(),
)

app = App(
    root_agent=root_agent,
    name="orchestrator",
)
