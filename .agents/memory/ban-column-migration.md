---
name: Ban-column migration
description: Safe rollout guidance for the salon user ban field rename.
---

The application source of truth is `is_banned`; the previous `banned` column is retained temporarily as a compatibility bridge. Existing values must be copied before removing the legacy column.

**Why:** Drizzle detects a column rename as an interactive destructive change, and non-interactive schema pushes cannot safely choose whether to preserve or drop the old data.

**How to apply:** Keep both columns until all environments are migrated, then use the supported publish-time migration flow to remove `banned` after confirming production values and ban behavior.