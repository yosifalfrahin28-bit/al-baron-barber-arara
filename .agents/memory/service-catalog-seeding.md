---
name: Service catalog deletion and seeding
description: The durable behavior for admin service deletion and initial catalog seeding.
---

Admin service deletion is a true delete. Default services are seeded only when the catalog has never been seeded; a persistent settings flag prevents deleted services from returning after an API restart.

**Why:** The admin catalog must remain editable across restarts. Soft-deleting a service would leave stale records and reseeding based only on an empty visible list could unexpectedly restore services.

**How to apply:** Preserve the one-time seed marker when changing service CRUD or startup initialization, and treat deletion as irreversible in the admin UI.