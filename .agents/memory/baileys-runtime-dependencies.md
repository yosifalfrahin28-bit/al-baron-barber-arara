---
name: Baileys runtime dependencies
description: Runtime dependency handling for the bundled WhatsApp integration
---

When the API build externalizes a Baileys dependency such as protobufjs, that package must be declared directly in the API server workspace rather than relying only on Baileys' transitive dependency tree.

**Why:** The bundled server resolves externalized imports from the API artifact's package boundary at startup, and a transitive pnpm store entry is not necessarily exposed there.

**How to apply:** After adding or upgrading Baileys, inspect the build's external list and add every required external runtime package to artifacts/api-server/package.json, then restart the API workflow.