# Caddy security layer

Hardened reverse proxy in front of PocketBase for the XpnsLight tailnet deployment. PocketBase stays on **loopback only**; clients talk to Caddy over **HTTPS** on your Tailscale port (default `18312`).

## Threat model

| Layer | Control |
|-------|---------|
| Network | Tailscale CGNAT (`100.64.0.0/10`) + ULA; non-tailnet IPs get `403` |
| Transport | TLS (`internal` CA by default; use Tailscale HTTPS or ACME if you prefer) |
| Admin UI | `/_/admin` blocked unless request comes from `127.0.0.1` (use SSH tunnel) |
| API abuse | 120 req/min per host, 2MB body limit, bad HTTP methods rejected |
| Headers | HSTS, nosniff, DENY framing, minimal CSP |
| Application | PocketBase collection rules require authenticated users (see `pocketbase-rules.example.json`) |

## Quick start

```bash
cd caddy
cp env.example .env
# Edit .env — set XPNS_LISTEN to your tailnet IP if you want bind narrowing

docker compose up -d --build
```

First-time PocketBase admin (loopback only):

```bash
ssh -L 8090:127.0.0.1:8090 your-server
# Open http://127.0.0.1:8090/_/ on the laptop
```

Set **Settings → Application → Public URL** to `https://<tailscale-ip>:18312`.

## PocketBase hardening checklist

1. `serve --http=127.0.0.1:8090` — never publish `:8090` on `0.0.0.0`
2. Apply auth rules from `pocketbase-rules.example.json` on the `expenses` collection
3. Create app users in the `users` auth collection (email + password)
4. Disable open API rules (`""` or `null`) on production data
5. Rotate `PB_ENCRYPTION_KEY` and back up `/pb_data`

## App configuration

Point the mobile app at Caddy, not raw PocketBase:

```env
VITE_POCKETBASE_URL=https://100.x.x.x:18312
```

With `tls internal`, install the Caddy root CA on your Android device **or** use [Tailscale HTTPS certificates](https://tailscale.com/kb/1153/enabling-https) and set `XPNS_TLS_MODE` accordingly.

## Optional: Tailscale HTTPS instead of `tls internal`

Replace the site block `tls` line with Tailscale-issued certs (paths depend on your OS) or use Tailscale Serve. See Tailscale docs for `tailscale cert`.

## Files

| File | Purpose |
|------|---------|
| `Caddyfile` | Proxy, ACLs, rate limit, headers |
| `Dockerfile` | Caddy + `caddy-ratelimit` plugin |
| `docker-compose.yml` | PocketBase (loopback) + Caddy (tailnet port) |
| `env.example` | Listen port and upstream |
| `pocketbase-rules.example.json` | Authenticated-only API rules |
