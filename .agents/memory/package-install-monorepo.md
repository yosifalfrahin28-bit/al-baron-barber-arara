---
name: Workspace package installation
description: Installing dependencies for one artifact in the pnpm monorepo
---

The generic package-install helper may target the workspace root and refuse to add a dependency because of the monorepo root check. Use the package manager's workspace filter to add a dependency directly to the owning artifact package, then run that package's typecheck.

**Why:** Artifact-specific runtime dependencies must be recorded in the artifact package rather than accidentally added to the workspace root.

**How to apply:** For API-only dependencies, install through the API package filter and verify both the package manifest and lockfile before restarting its workflow.