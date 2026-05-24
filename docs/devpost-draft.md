# Devpost submission draft

**Canonical:** [`spec.md`](spec.md) §18 · Refine before submit.

---

## Summary

Practice Companion is an AI photography mentor that combines multimodal critique with adaptive practice planning, grounded in each photographer’s persistent aesthetic identity. Unlike single-shot graders, it remembers portfolios, assignments, and improvement over time — then plans what to practice next.

## Features

- Glass Box multimodal critique (5-axis scores + spatial overlays)
- Adaptive practice assignments with explicit rationale
- Reflection and **Intentional Skill Application Rate (ISAR)** across shoots
- MongoDB memory: portfolio embeddings, Atlas Vector Search, Atlas Search on critique text, change-stream-driven aesthetic profile
- Agent Builder–grounded photography principles
- XMP sidecar export for Lightroom workflows
- Hobbyist vs working-pro modes

## Technologies

Gemini 3 Pro · Google ADK · Vertex AI Agent Engine · Agent Builder Data Store · MongoDB Atlas (Flex) · MongoDB MCP Server · Cloud Run · Cloud Storage · Firebase Hosting · React · TypeScript · Python

## Data sources

- Curated photography principles (`principles/*.md`) in Agent Builder Data Store
- Demo photos: author’s own work and/or Unsplash/Pexels with documented licenses
- User-uploaded images stored in **Google Cloud Storage**; metadata and embeddings in MongoDB

## Findings & learnings

*(Fill after build — be honest.)*

- What worked: e.g. co-locating vectors + operational docs in Atlas; MCP for orchestrator memory reads  
- What was hard: cross-region Atlas (`eu-west3`) vs Vertex (`us-central1`); Agent Engine cold start  
- Surprises: …

## Track

**MongoDB**

## Links

- Hosted app: `https://<firebase-site>.web.app`  
- Agent API: *(Agent Engine endpoint)*  
- Repo: `https://github.com/prasadt1/photography-practice-companion`  
- Video: *(YouTube/Vimeo)*

## Prior work attribution

Built on architectural learnings from [Photography Coach (Gemini 3)](https://github.com/prasadt1/photography-coach-ai-gemini3) and [L.E.N.S. / Gemma4](https://github.com/prasadt1/photography-coach-gemma4). This repo is a **new** multi-agent product with MongoDB memory and practice planning — contest-period implementation.
