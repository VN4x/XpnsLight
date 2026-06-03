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

## PocketBase setup

Point the app at your Tailscale PocketBase host (default in code: `http://100.x.x.x:18312`). Override with `.env`:

```bash
cp .env.example .env
# edit VITE_POCKETBASE_URL to your Tailscale IP
```

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

Enable **list** and **create** rules appropriate for your auth model (e.g. open for a private Tailscale-only instance).

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

Build and run from Android Studio. Ensure the device can reach your PocketBase URL over Tailscale.

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
src/
  App.svelte                 # View switch: dashboard | entry
  app.css                    # Global theme
  lib/
    pocketbase.ts            # PB client + CRUD
    vat.ts                     # VAT math
    storage.ts                 # Tag cache
    csv.ts                     # CSV export
    share.ts                   # Capacitor Share / web download
    components/
      Dashboard.svelte
      EntryForm.svelte
```
