---
name: Browser session cookies
description: Authentication behavior for generated API requests in the Al-Baron browser client
---

The salon browser authenticates with an HTTP-only session cookie. Read-only state can use generated queries, but session-dependent mutations should use the shared direct session request helper with `credentials: include`; this keeps login, booking, queue, cancellation, settings, services, and admin actions on one reliable path.

**Why:** The failure appeared as intermittent-looking 401 responses on appointment, queue, settings, and admin endpoints even though the user had just signed in; the hand-written auth flow and generated mutation flow were not behaving consistently in the preview.

**How to apply:** Keep credentials included by default in the shared browser request helper and confirm the session endpoint after login before navigation. Allow an individual caller to explicitly opt out only when it is intentionally making a cross-origin or public request.