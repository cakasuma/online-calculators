# ToolHub MY

ToolHub MY is a mobile-first utility tools web app built with Vite + React + wouter routing.

## Current Tool Categories

- **Finance:** Malaysia Salary Calculator
- **Math:** Basic Calculator, Scientific Calculator
- **Islamic:** Faraid Calculator, Zakat Calculator
- **Documents:** Wasiat Guide

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

### Ads (build-time, Vite)

- `VITE_ADSENSE_CLIENT` – your AdSense publisher ID (e.g. `ca-pub-...`)
- `VITE_ADSENSE_SLOT_TOP` – ad slot ID for the global top ad placement
- `VITE_ADSENSE_SLOT_HOME` – ad slot ID for the homepage ad placement

If these are empty, the UI shows a non-breaking placeholder ad container.
AdSense network scripts/requests are only enabled in production builds (`import.meta.env.PROD`).

### Analytics (build-time, Vite)

- `VITE_PLAUSIBLE_DOMAIN` – your verified Plausible domain. Leave blank to disable.
- `VITE_PLAUSIBLE_SCRIPT` – optional override for self-hosted Plausible. Defaults to `https://plausible.io/js/script.js`.

The Plausible script is only injected in production builds. Custom events emitted: `pageview`, `cta_view`, `cta_click`, `lead_submit_success`, `lead_submit_error` — all tagged with `calculator`, `intent`, and `source`.

### Lead capture & events (runtime, server)

- `DATABASE_URL` – Postgres connection string used by `server/db.ts` (drizzle + `postgres-js`).

When set, leads from the `LeadCaptureCard` (Faraid, Wasiat, Zakat, Salary) and event pings are persisted to the `leads` and `calculation_events` tables. Run `npx drizzle-kit push` to apply the schema. If unset, the server falls back to in-memory storage so the app still runs locally — leads and events are lost on restart. The endpoints `POST /api/leads` and `POST /api/events` are rate-limited per IP (20 req/min).

## Production Build

```bash
npm run build
npm run start
```

## Vercel Deployment

This repo is ready for Vercel deployment:

- `vercel.json` sets `npm run build` and output to `dist/public`
- SPA routing rewrite is configured to route all paths to `index.html`

### Suggested Vercel Setup

1. Import this repository into Vercel.
2. Framework preset: **Other**.
3. Build command: `npm run build`.
4. Output directory: `dist/public`.
5. Install command: `npm install`.
6. Add Production Environment Variables:
   - `VITE_ADSENSE_CLIENT`
   - `VITE_ADSENSE_SLOT_TOP`
   - `VITE_ADSENSE_SLOT_HOME`

### Subdomain Connection Notes

When you are ready to connect a subdomain (for example `tools.example.com`):

1. In Vercel project settings, open **Domains** and add your subdomain.
2. In your DNS provider, create a `CNAME` record pointing the subdomain to `cname.vercel-dns.com`.
3. Wait for DNS propagation, then verify SSL is issued in Vercel.
4. Optional: set the subdomain as your Production Domain in Vercel.

> If you are using Cloudflare proxy mode, ensure SSL/TLS mode is compatible (typically Full or Full Strict).
