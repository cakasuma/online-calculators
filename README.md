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

Monetization is controlled with Vite env vars:

- `VITE_ADSENSE_CLIENT` – your AdSense publisher ID (e.g. `ca-pub-...`)
- `VITE_ADSENSE_SLOT_TOP` – ad slot ID for the global top ad placement
- `VITE_ADSENSE_SLOT_HOME` – ad slot ID for the homepage ad placement

If these are empty, the UI shows a non-breaking placeholder ad container.
AdSense network scripts/requests are only enabled in production builds (`import.meta.env.PROD`).

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
