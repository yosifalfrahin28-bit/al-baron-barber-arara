# Al-Baron external deployment

This repository contains two deployable applications:

- `artifacts/api-server`: Express API, PostgreSQL access, scheduled jobs, and the Baileys integration.
- `artifacts/al-baron-mobile`: React/Vite PWA frontend.

## Important limitations of “free forever”

Free-tier policies, quotas, and sleep behavior can change. Neon/Vercel/Render each have free options, but there is no universal “free forever” guarantee.

Baileys is stateful. A free web service with an ephemeral filesystem can lose `.data/whatsapp-auth` after a restart or sleep and require a new QR pairing. For reliable WhatsApp operation, use a persistent disk/volume or move the Baileys auth state to durable database/object storage. If that is not available, deploy the API with `WHATSAPP_ENABLED=false` and do not promise WhatsApp delivery.

## 1. Create the external PostgreSQL database

1. Create a Neon or Supabase PostgreSQL project.
2. Copy its pooled/runtime connection string.
3. Keep `sslmode=require` in the URL when the provider requires TLS.
4. Set the same `DATABASE_URL` in the API host and locally when running Drizzle.
5. Apply the schema from the repository:

```bash
pnpm install
DATABASE_URL='postgresql://...' pnpm --filter @workspace/db run push
```

The database package already reads the standard `DATABASE_URL` variable in both `src/index.ts` and `drizzle.config.ts`; no Replit-specific database code is required.

## 2. Push the repository to GitHub

Before the first push, make sure WhatsApp device files are not tracked:

```bash
git rm -r --cached artifacts/api-server/.data/whatsapp-auth 2>/dev/null || true
git add .gitignore
git add .
git commit -m "Prepare external deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Never commit `.env`, `creds.json`, device keys, QR output, or any file under `whatsapp-auth`.

## 3. Deploy the API on Render

1. In Render, create a Blueprint from the GitHub repository, or create a Node web service manually.
2. `render.yaml` supplies the build command, `start:api` command, and `/healthz` health check.
3. Add secret environment variables:
   - `DATABASE_URL`: Neon/Supabase connection string.
   - `FRONTEND_ORIGIN`: the final Vercel or Netlify URL. Multiple origins may be comma-separated.
4. Deploy and open `https://YOUR-API.onrender.com/healthz`.
5. If using Baileys, set `WHATSAPP_ENABLED=true` and provide durable storage at the configured `WHATSAPP_AUTH_DIR`. Render’s free filesystem is not durable; without a volume, expect to pair again after restarts.
6. Scan the QR from the server logs/admin QR flow only after the service is stable.

The API and Baileys code remain in separate modules, but they intentionally run in one Node process so API routes can send WhatsApp messages without an additional message broker. Do not run two Baileys processes against the same auth directory.

## 4. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Keep the repository root as the project root; `vercel.json` already points to the workspace build and `dist` output.
3. Add the build variable:
   - `VITE_API_BASE_URL=https://YOUR-API.onrender.com`
4. Deploy the frontend.
5. Copy its final URL into Render’s `FRONTEND_ORIGIN`, then redeploy the API.

The client uses `VITE_API_BASE_URL` for cross-origin hosting. On same-origin Replit routing it can remain empty and requests use `/api`.

## 5. Netlify alternative

Use these settings instead of Vercel:

- Build command: `pnpm install --frozen-lockfile && pnpm --filter @workspace/al-baron-mobile run build`
- Publish directory: `artifacts/al-baron-mobile/dist`
- Environment variable: `VITE_API_BASE_URL=https://YOUR-API.onrender.com`
- Add an SPA fallback rewrite from `/*` to `/index.html`.

## 6. Local production checks

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/al-baron-mobile run typecheck
pnpm --filter @workspace/al-baron-mobile run build
```

The API requires `DATABASE_URL` at startup. The frontend does not contain database credentials; only `VITE_API_BASE_URL` is exposed to the browser.