---
name: Orval API Zod exports
description: Code generation can create duplicate type exports in the shared Zod package.
---

After regenerating the API clients, verify the shared Zod package entrypoint. Orval may append a wildcard export from generated types even when the entrypoint already exports generated schemas, which can create duplicate names such as request-body schemas. Keep conflicting generated interfaces as explicit type-only exports instead of wildcard re-exports.

**Why:** The OpenAPI generator emits both runtime Zod schemas and TypeScript interfaces with overlapping names, and the workspace uses isolated module compilation.

**How to apply:** Run the library typecheck after codegen and resolve any duplicate export by keeping the runtime schema export and explicitly re-exporting non-conflicting interfaces with `export type`.