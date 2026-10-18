# WHOOP Intelligence V2

Independent Arabic/English personal wellness analytics, using authenticated WHOOP API v2 records. Not affiliated with WHOOP; not a medical diagnosis or exercise clearance service.

[Dashboard](https://3bhussein.github.io/Whoop-Intelligence-/analysis.html) · [Account](https://3bhussein.github.io/Whoop-Intelligence-/) · [Privacy](https://3bhussein.github.io/Whoop-Intelligence-/privacy.html)

## Implemented

- Dark mobile/desktop dashboard: Overview, Recovery, Sleep, Cardiovascular, Training, Insights, Reports and Settings.
- Arabic RTL / English LTR; accessible SVG timelines with data tables; printable reports.
- 7/30 calendar-day medians and means, previous equal-length periods, per-metric sample sizes, coverage, timestamps and prior personal baselines.
- Five descriptive relationships: sleep–recovery, sleep–HRV, prior-day strain–recovery, prior-day strain–RHR and sleep consistency–recovery. Minimum seven varying pairs; leave-one-out sensitivity warning; no causal claims.
- Cycle/sleep ID joins and WHOOP local offsets; naps, unavailable scores and calibration excluded where appropriate. Sleep duration uses stage totals or bed minus awake and no-signal time. Sleep efficiency is displayed only from WHOOP's scored source field.
- Authenticated paginated read/export; bounded paginated sync, rate-limit backoff, refresh serialization, duplicate-safe upserts and per-user sync monitoring.

## Run and test

Node 24 is required for the Edge Function fixture harness (`stripTypeScriptTypes`).

```sh
npm ci
npm test
npx playwright install --with-deps chromium firefox webkit
ALL_BROWSERS=1 npm run test:browser
python3 -m http.server 8765
```

Browser tests intercept the SDK and API using safe fixtures. They do not log in to WHOOP or delete live records. For local browser development the production backend allows the production origin, not arbitrary localhost origins.

## Architecture and deployment

Static HTML, CSS and ES modules live at the repository root / `assets/`. Pure analytics live in `assets/analytics.js`; no demo data is imported by production code. Only a Supabase publishable key appears in the browser. Existing email-link authentication is preserved.

Supabase project **whoop-intelligence** (`jsfeybhgobmrydcfnyjg`) is independent of ProgressXX. Server function sources are versioned under `supabase/functions/`. Required server-only environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_TOKEN_ENCRYPTION_KEY` (base64 32-byte AES key). Never publish their values. Callback URL: `https://jsfeybhgobmrydcfnyjg.supabase.co/functions/v1/whoop-callback`.

The existing callback and start function are preserved snapshots; this release deploys changes only to data/account functions. These endpoints retain `verify_jwt=false` because their bodies validate the bearer token using Supabase Auth `getUser`; the callback validates and atomically consumes one-time state instead.

GitHub Pages runs tests before deployment and publishes only HTML + `assets/`, excluding tests, backend code and dependencies. The PR verification workflow additionally tests Chromium, Firefox and WebKit.

## Important operational limits

- Automatic sync runs only while a dashboard session is open. Secure server scheduler and webhook processing are not configured.
- Manual sync / first V2 auto-sync requests a 62-day repair window; later automatic sync overlaps at least seven days. Each category has a 20-page safety cap and a shared time budget; incomplete requests are explicit. This is not unlimited historical backfill or persistent cursor resume.
- Complete cached read/export is paginated, capped at 20,000 rows per request (per type for dashboard reads). Over-cap operations fail, rather than silently truncate. Exports are not a transactional snapshot during concurrent changes.
- Refresh uses encrypted credentials, a per-user lease and owner-conditional persistence. A crash between WHOOP rotation and persistence may require reconnecting. Real expired-token refresh still needs acceptance testing.
- Local disconnect deletes cached health records, local tokens, pending states and sync history. Remote WHOOP revocation, transactional deletion with concurrent sync protection, Supabase login deletion and backup retention are still pending. Never test deletion using the existing real connection.
- See [Development Log](docs/DEVELOPMENT-LOG.md), [Roadmap](docs/ANALYTICS-ROADMAP.md) and [Security audit](docs/SECURITY-REVIEW.md) for exact verification evidence and remaining work.

## V2 release verification

[PR #1](https://github.com/3bHussein/Whoop-Intelligence-/pull/1) merged and [deployed successfully](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39138948237). [CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39138835902) executed 26 Node tests and 21 browser scenarios across Chromium, Firefox and WebKit. Production asset hashes match the checked source. Real-account expiry, irreversible deletion and physical-device acceptance remain separate open checks.
