# XpnsLight

A lightweight personal **Android expense tracker** built with **Svelte 5**, **Capacitor**, and **PocketBase**. The UI is a single-page app with conditional views: a filterable dashboard and a manual expense entry overlay.

## Design

- Minimal high-contrast layout: 1–1.5px charcoal borders, `border-radius: 98px` on panels
- Monospace typography at 13px
- Red accents for titles and primary actions; blue dashed panel highlights
- No CSS transitions or animations (static UI)

## Features

### Dashboard

- Hero metrics: **Total Net (ZeroVAT)** and **Total Gross (WithVAT)** for the active filter range
- Filters: start/end date pickers and reference tag dropdown
- Vendor feed: per-vendor net/gross totals
- Footer: **+ Add New Expense** (opens entry form) and **Export Data** (CSV via `@capacitor/share` on device, file download on web)

### Manual entry

- Fields: date, document number, vendor, reference tag, gross (WithVAT)
- VAT dropdown (0%, 5%, 20%) with live net/VAT breakdown
- Reference tags cached in `localStorage` for datalist suggestions
- Validates then calls `pb.collection('expenses').create()`

## Security (Caddy + auth)

PocketBase must **not** be exposed directly on the tailnet. Use the hardened Caddy stack in [`caddy/`](caddy/README.md):

- TLS on port `18312` (default)
- Tailscale-only IP allowlist
- Rate limiting, security headers, admin UI loopback-only
- PocketBase bound to `127.0.0.1:8090`

```bash
cd caddy && cp env.example .env && docker compose up -d --build
```

The app requires **HTTPS** in production and **PocketBase user login** (`users` auth collection). Apply API rules from `caddy/pocketbase-rules.example.json` so only authenticated users can read/write `expenses`.

```bash
cp .env.example .env
# VITE_POCKETBASE_URL=https://100.x.x.x:18312
```

## PocketBase setup

Create a collection named **`expenses`** with these fields:

| Field | Type | Notes |
|-------|------|--------|
| `date` | Date | Required |
| `document_number` | Plain text | Required |
| `vendor` | Plain text | Required |
| `reference_tag` | Plain text | Required |
| `gross_with_vat` | Number | Required |
| `net_zero_vat` | Number | Required |
| `vat_amount` | Number | Required |
| `vat_rate` | Number | 0, 5, or 20 |

Set collection rules to **`@request.auth.id != ""`** for list/create/update/delete (see `caddy/pocketbase-rules.example.json`). Create app users in the **`users`** auth collection.

## Development

```bash
npm install
npm run dev
```

## Android (Capacitor)

```bash
npm run build
npx cap add android    # first time only
npx cap sync
npx cap open android
```

Or use the shortcut:

```bash
npm run cap:android
```

Build and run from Android Studio. The device must reach the **Caddy HTTPS** URL over Tailscale. For `tls internal`, install the Caddy root CA on the device or use Tailscale HTTPS certs (see `caddy/README.md`). Cleartext HTTP is disabled in the Android manifest.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production web build → `dist/` |
| `npm run check` | Typecheck |
| `npm run cap:sync` | Build + sync to native projects |
| `npm run cap:android` | Sync and open Android Studio |

## Project structure

```
caddy/
  Caddyfile                 # TLS proxy, tailnet ACL, rate limits
  docker-compose.yml        # PocketBase (loopback) + Caddy
  pocketbase-rules.example.json
src/
  App.svelte                 # View switch: dashboard | entry
  app.css                    # Global theme
  lib/
    pocketbase.ts            # PB client + CRUD (HTTPS enforced in prod)
    auth.ts                    # Login / logout
    vat.ts                     # VAT math
    storage.ts                 # Tag cache
    csv.ts                     # CSV export
    share.ts                   # Capacitor Share / web download
    components/
      Dashboard.svelte
      EntryForm.svelte
      LoginForm.svelte
```
