---
name: API polling cache behavior
description: Polling endpoints must not return empty 304 responses to the generated client.
---

Disable ETags or otherwise preserve the previous payload for API polling responses. The generated fetcher treats a bodyless 304 as an empty result, which can replace live appointment and customer lists with blank state during refresh.

**Why:** Express conditional responses were observed during the salon dashboard's polling cycle, and the client cannot reconstruct the cached JSON from a bodyless response.

**How to apply:** Keep `Cache-Control: no-store` on the `/api` middleware for stateful dashboard endpoints, then verify repeated polls remain `200` responses with payloads.