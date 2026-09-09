---
name: Embedded preview authentication
description: Authentication behavior in embedded Replit previews where browser cookie persistence can differ from direct API clients
---

Embedded Replit previews, especially Safari-based embedded views, can successfully complete password or OTP authentication while an immediate cookie-only session check still returns 401. Keep the HTTP-only cookie as the primary mechanism, but preserve a short-lived browser-session fallback for the authenticated response and send it on subsequent API requests.

**Why:** The backend accepted the credentials and issued a session, but the embedded browser did not reliably return the cookie during the next request, producing a false “session could not be established” error.

**How to apply:** When changing auth response shapes or frontend session handling, test the sequence of authenticate → immediate session lookup → protected API request in the embedded preview, not only with curl or a direct browser tab.