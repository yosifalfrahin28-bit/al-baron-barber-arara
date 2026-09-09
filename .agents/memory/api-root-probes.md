---
name: API root probes
description: Why workflow health probes need app-level root handlers in the Al-Baron API.
---

Workflow and proxy health checks can request `/` or `/healthz` directly on the API process rather than through the `/api` router.

**Why:** Routes mounted with `app.use("/api", router)` cannot satisfy a request to the process root, so putting a root response inside the shared API router still produces misleading 404 entries in server logs.

**How to apply:** Keep `/` and `/healthz` handlers on the Express app layer, while feature endpoints remain under `/api`. Verify both direct API probes and proxied `/api/...` requests after workflow changes.