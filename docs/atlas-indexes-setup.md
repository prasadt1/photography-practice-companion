# Atlas Vector Search & Atlas Search indexes

Run **after** `python3 scripts/bootstrap-mongodb.py` succeeds.

**Database:** `practice_companion` · **Collection:** `portfolio_entries`

---

## 1. Vector Search index (1408-dim embeddings)

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → your project → cluster **`practice-photography-companion-mvp-cluster`**.
2. **Atlas Search** (left nav) → **Create Search Index**.
3. Choose **Atlas Vector Search** (not classic full-text only).
4. **Database:** `practice_companion` · **Collection:** `portfolio_entries`.
5. **Index name:** `portfolio_embedding_vector` — must match `ATLAS_VECTOR_INDEX` in `.env` (default in code).
6. **Configuration** → JSON Editor, paste:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1408,
      "similarity": "cosine"
    }
  ]
}
```

7. **Create**. Status must reach **Active** (often 1–5 minutes on Flex).

**Note:** Index build needs at least one document with an `embedding` array of length 1408, or Atlas may still create the index but queries return nothing until data exists. Phase 2/3 seed adds these.

---

## 1b. Vector Search index (text embeddings for NL library search)

Natural-language library search compares **query text** to **`text_embedding`** (scene description + tags), not raw image pixels.

1. Same cluster → **Atlas Search** → **Create Search Index** → **Atlas Vector Search**.
2. **Database:** `practice_companion` · **Collection:** `portfolio_entries`.
3. **Index name:** `portfolio_text_vector` — must match `ATLAS_TEXT_VECTOR_INDEX` in `.env`.
4. Paste:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "text_embedding",
      "numDimensions": 1408,
      "similarity": "cosine"
    }
  ]
}
```

5. **Create** → wait until **Active**.
6. Backfill existing entries: `python3 scripts/backfill-text-embeddings.py` (from repo root, with `.env` and Vertex credentials).

---

## 2. Atlas Search index (Glass Box full-text)

1. Same cluster → **Atlas Search** → **Create Search Index**.
2. Choose **Atlas Search** (JSON Editor).
3. **Database:** `practice_companion` · **Collection:** `portfolio_entries`.
4. **Index name:** `glass_box_search` (match spec / agent tools).
5. Paste:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "scene_description": { "type": "string" },
      "colour_notes": { "type": "string" },
      "user_tags": { "type": "string" },
      "glass_box": {
        "type": "document",
        "fields": {
          "observations": { "type": "string" },
          "reasoning_steps": { "type": "string" },
          "priority_fixes": {
            "type": "document",
            "fields": {
              "issue": { "type": "string" }
            }
          }
        }
      },
      "aesthetic_tags": { "type": "string" }
    }
  }
}
```

**If you already created `glass_box_search` without `scene_description`:** edit the index in Atlas → **Edit definition** → add the three string fields above → save and wait for **Active**. Library search reads scene text (where “van”, “RV”, “glacier” live), not just Glass Box bullets.

6. **Create** (or save edit) → wait until **Active**.

---

## 3. Verify (optional)

**Atlas UI:** Search → Indexes → both show **Active** on `portfolio_entries`.

**After first seeded document with `embedding`:**

In Claude Code / Cursor with MongoDB MCP:

```
On practice_companion.portfolio_entries, run a vector search example for aesthetic similarity (if supported).
```

Or PyMongo (when you have a query vector):

```python
# Phase 2+ — illustrative only
pipeline = [
  {
    "$vectorSearch": {
      "index": "portfolio_embedding_vector",
      "path": "embedding",
      "queryVector": [...],  # 1408 floats
      "numCandidates": 50,
      "limit": 5,
    }
  }
]
```

---

## 4. Step 3 from bootstrap output

`scripts/seed-demo-data.py` is **Phase 3** (not written yet). Skip until agents + GCS upload exist.

**Order:** indexes (this doc) → Phase 1 scaffold → Phase 2 agents → seed script.
