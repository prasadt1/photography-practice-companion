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
Practice Companion — ADK playground entry (v5 multi-agent orchestrator).

Delegates to sub-agents via AgentTool (app/agent.py). Legacy FunctionTool-only
orchestrator removed in Phase 1 per docs/spec.md §2.1.
"""

import os
from pathlib import Path

import google.auth
from dotenv import load_dotenv
from google.adk.apps import App
from google.genai import types

from agent import build_orchestrator_agent

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

try:
    _, project_id = google.auth.default()
except Exception:
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "practice-companion-hackathon")

os.environ["GOOGLE_CLOUD_PROJECT"] = project_id

gemini_location = os.getenv(
    "VERTEX_AI_GEMINI_LOCATION",
    os.getenv("GEMINI_VERTEX_REGION", "global"),
)
os.environ["GOOGLE_CLOUD_LOCATION"] = gemini_location
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

def _default_persona() -> str:
    try:
        from memory.users import get_persona

        return get_persona(None)
    except Exception:
        return os.getenv("DEFAULT_PERSONA", "hobbyist")


default_persona = _default_persona()
root_agent = build_orchestrator_agent(default_persona)

app = App(
    root_agent=root_agent,
    name="orchestrator",
)
