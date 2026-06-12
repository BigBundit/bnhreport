# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SEO/analytics dashboard for BNH Hospital (bnhhospital.com). Pulls Google Analytics 4 and Google Search Console data via OAuth, displays it in a React dashboard, and generates Thai-language AI insights via Gemini. UI text is largely in Thai.

## Commands

- `npm run dev` — start dev server (Express + Vite middleware) at http://localhost:3000
- `npm run build` — Vite production build to `dist/`
- `npm run lint` — typecheck only (`tsc --noEmit`); there is no ESLint and no test suite

## Architecture

One Express app ([server.ts](server.ts)) serves both the API and the frontend, with two deployment modes:

- **Local** (`npm run dev`): `server.ts` starts an HTTP listener on port 3000 and mounts Vite in middleware mode (SPA). With `NODE_ENV=production` it serves the built `dist/` instead.
- **Vercel**: the listener block is skipped (`process.env.VERCEL` check at the bottom of server.ts). [api/index.ts](api/index.ts) re-exports the Express app as a Vercel Function; [vercel.json](vercel.json) rewrites `/api/*` and `/auth/callback` to it and everything else to `index.html`.

If you add server routes, they go in `server.ts` — `api/index.ts` is just a thin wrapper and the vercel.json rewrites must cover any new non-`/api` server paths.

### Auth and data flow

1. Google OAuth (popup flow): `/api/auth/url` builds the consent URL; `/auth/callback` exchanges the code, stores tokens in a **Turso (libsql)** `oauth_tokens` table keyed by a random session ID, and sets a `session_id` httpOnly cookie (1 year). The popup notifies the opener via `postMessage({ type: 'OAUTH_AUTH_SUCCESS' })`.
2. The frontend never calls Google APIs directly. It posts `{ url, method, body }` to `/api/fetch-data/:service`, a generic proxy in server.ts that refreshes the access token (always refreshes, no expiry check) and forwards the request with the Bearer token. Callers in [src/App.tsx](src/App.tsx) (`proxyFetch`) hit GA4 (`analyticsdata.googleapis.com` runReport / runRealtimeReport) and GSC (`searchconsole.googleapis.com` searchAnalytics/query).
3. `/api/insights` calls Gemini (`gemini-2.5-flash` via REST) with a hardcoded Thai SEO-analyst prompt. The Gemini API key is supplied by the user in the UI and persisted in `localStorage` — it is not a server env var.

### Frontend

React 19 + Vite + Tailwind v4 (via `@tailwindcss/vite`) + Recharts. [src/App.tsx](src/App.tsx) owns all state (auth, filters, GA4/GSC data, loading) and passes it down to the components in `src/components/`; there is no router or state library. Shared types in [src/types.ts](src/types.ts); formatting helpers, page-title mapping, CSV/PNG export, and the AIO-keyword heuristic (`isAIOQuery` — long-tail or Thai/English question keywords) in [src/utils.ts](src/utils.ts).

Defaults hardcoded in App.tsx: GA4 property ID `283309066`, site URL `https://www.bnhhospital.com/`.

## Environment

Set in `.env.local` (see [.env.example](.env.example)): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`. `APP_URL` determines the OAuth redirect URI (falls back to Vercel URLs, then localhost:3000) — it must match the redirect URI registered in Google Cloud Console.

## Notes

- `tsconfig.json` maps `@/*` to the repo root, and vite.config.ts aliases `@` the same way.
- vite.config.ts has an HMR/`DISABLE_HMR` block from the project's AI Studio origin — leave it alone.
