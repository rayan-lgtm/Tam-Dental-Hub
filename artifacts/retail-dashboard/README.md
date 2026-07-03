# Retail Margins & Retailer KPIs Dashboard

Pulls product & sales data from **Cin7 Core** (formerly DEAR Systems), overlays
marketing/media-buying spend, and surfaces margin-after-discount and
retailer-performance KPIs. Optionally embeds a **Looker Studio** report for
media buying spend.

This is a separate business unit from the TAM Dental patient app in this
monorepo — it only shares the workspace's infra (Postgres/Drizzle, the
Express API server, the OpenAPI/orval codegen pipeline, and the Vite/shadcn
front-end conventions).

## How it fits together

```
Cin7 Core API  →  cin7-sync (artifacts/api-server/src/lib/cin7-sync.ts)  →  Postgres
                                                                              │
Marketing spend (manual entry / CSV / XLSX import) ──────────────────────────┤
                                                                              │
                              margin & retailer-KPI queries (lib/margins.ts, │
                              lib/retailer-kpis.ts) ─────────────────────────┤
                                                                              ▼
                                                        Express routes (/api/*)
                                                                              │
                                                                              ▼
                                              retail-dashboard (this artifact, React)
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | api-server, scripts | Postgres connection string (shared with the rest of the workspace) |
| `CIN7_ACCOUNT_ID` | api-server | Cin7 Core `api-auth-accountid` |
| `CIN7_APPLICATION_KEY` | api-server | Cin7 Core `api-auth-applicationkey` |
| `CIN7_API_BASE_URL` | api-server | Optional override, defaults to `https://inventory.dearsystems.com/ExternalApi/v2` |
| `VITE_LOOKER_STUDIO_EMBED_URL` | retail-dashboard | Optional. A Looker Studio report's embeddable URL (Looker Studio → File → Embed report), shown as an iframe on the Marketing tab |
| `PORT`, `BASE_PATH` | retail-dashboard | Standard Vite dev/serve config (see `.replit-artifact/artifact.toml`) |
| `API_PROXY_TARGET` | retail-dashboard (dev only) | Where `/api/*` is proxied to in local dev; defaults to `http://localhost:8080` |

`CIN7_ACCOUNT_ID`/`CIN7_APPLICATION_KEY` aren't set anywhere in this repo —
add them as Replit secrets (or your deploy target's secret store). Until
they're set, use the seed script below for realistic demo data.

## Getting real Cin7 data flowing

1. In Cin7 Core: Settings → Integrations & API → API Access, create/copy the
   Account ID and Application Key.
2. Set `CIN7_ACCOUNT_ID` and `CIN7_APPLICATION_KEY` as secrets for the
   `api-server` deployment.
3. Hit **Sync Cin7** in the dashboard header, or `POST /api/cin7/sync`
   directly. This pulls products, customers (as retailers), and sale
   orders/lines (with per-line discount and landed-cost snapshots).
4. Re-sync any time — it's incremental for sale orders (tracked in
   `cin7_sync_state`) and a full refresh for products/retailers.

Cin7 has no concept of marketing spend, so that side is filled in
separately — either manually (the "Add entry" dialog) or by importing a
CSV/XLSX (columns: `retailer, channel, period_start, period_end, amount,
notes`; blank `retailer` = unallocated brand-level spend). This is also
where a Looker Studio media-buying export can be dropped in directly.

## Local development without real Cin7 credentials

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/retail_dashboard
pnpm --filter db run push                        # create tables
pnpm --filter @workspace/scripts run seed:retail-dashboard  # realistic sample data
PORT=8080 pnpm --filter @workspace/api-server run dev &
PORT=8082 pnpm --filter @workspace/retail-dashboard run dev
```

## KPI definitions

All figures are for a selected date range (`from`/`to`, inclusive) based on
`order_date`.

- **Gross margin** = net revenue (post-discount, pre-tax) − COGS, where COGS
  uses each sale line's landed-cost *snapshot* at time of sale (so margin on
  past orders doesn't drift when a product's current cost changes).
- **Net margin (after marketing)** = gross margin − marketing spend
  attributed to that retailer/product in the same period. Spend not tied to
  a specific retailer (`retailer_id IS NULL`, i.e. brand-level campaigns) is
  allocated across retailers proportionally to their revenue share in that
  period — retailer-level allocation only, not pushed down to individual
  products.
- **Discount %** = total discount amount ÷ gross (pre-discount) revenue.
- **ABC (Pareto) class**: retailers are ranked by revenue and bucketed by
  cumulative share — **A** = top 80% of revenue, **B** = next 15%, **C** =
  the long tail.
- **Revenue growth** compares the selected period to the immediately
  preceding period of equal length.
- **AR outstanding** = invoice total − amount paid, summed across orders in
  range (a rough proxy for collections risk, not a full DSO calculation).

## Adding a new KPI / endpoint

Follow the workspace convention: edit `lib/api-spec/openapi.yaml`, run
`pnpm --filter @workspace/api-spec run codegen`, implement the Express route
in `artifacts/api-server/src/routes/`, then consume the generated
`@workspace/api-client-react` hook from a page here.
