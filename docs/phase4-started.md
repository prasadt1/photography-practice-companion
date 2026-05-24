# Phase 4 — started

## Accept → Shoot now / Later

After **Accept** on a proposed assignment:

| Choice | Action |
|--------|--------|
| **Shoot now (Field)** | Opens **Field** tab with camera + active brief |
| **Upload later in Studio** | Opens **Studio** with assignment banner |
| **Not now** | Stays on Practice; active card remains |

## Field tab

- Live camera (`getUserMedia`) or **gallery pick** on HTTP
- **Capture & analyze** → `assignment_id` sent to Coach API (same as Studio)
- Success message → **Mark complete** in Practice for Reflection

## Demo flow

1. Practice → Suggest → Accept → **Shoot now**
2. Field → capture → analyze
3. Practice → Mark complete → Reflection
4. Memory → see linked portfolio entry

## Deploy

See [`deploy.md`](deploy.md):

```bash
./scripts/deploy-coach-api.sh
API_URL=https://YOUR-RUN-URL make deploy-hosting
```

## Still Phase 4+

- Voice coaching (LENS / gemma4)
- Vertex Agent Engine hosted deploy (optional)
- Change-stream listener
