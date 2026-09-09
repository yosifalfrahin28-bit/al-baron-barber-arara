---
name: Database project-reference builds
description: TypeScript consumers can resolve stale database declarations after schema changes.
---

After changing the database schema source, rebuild the database composite project with `tsc -b` before typechecking dependent packages.

**Why:** The API server can otherwise resolve the previous declaration output and report missing tables or columns even though the source schema and database push are correct.

**How to apply:** Run the database project build, then run the API/mobile typechecks and the normal application builds.