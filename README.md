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

## Simple and advanced views

The dashboard defaults to **Simple**: three key overview cards, a short personal recovery summary and sleep in hours/minutes. Metric definitions and calculation evidence expand on demand. **Advanced** preserves all charts, baselines, sample sizes, period averages, comparisons and relationships. The display preference is saved on this browser and survives refresh, language changes and navigation. Both views use the same authenticated records; display mode does not change calculations, synchronization or privacy controls.

Simple/Advanced shipped in [PR #2](https://github.com/3bHussein/Whoop-Intelligence-/pull/2), with [30 Node tests and 21 cross-browser scenarios passing](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39140053190).

## Daily, weekly and monthly reports

[Today’s report](https://3bhussein.github.io/Whoop-Intelligence-/analysis.html?period=1#reports) presents only the current WHOOP-local day's scored observations, compared with the preceding 30 calendar days (minimum seven earlier observations). Missing today remains missing, never replaced with yesterday. Today remains provisional because activity load can change. The redesigned report includes clear metric cards, completeness, expandable evidence, Simple/Advanced detail and print/PDF styling. Weekly/monthly comparisons use disjoint equal-length windows, with at least three observations in each. No WHOOP offset available means an explicit UTC fallback label.

## Meaning and practical context

Simple cards and reports now explain what a reading may mean and offer a conservative next step, using the **same period value and reference shown on the card**. A weekly median is never interpreted using a different latest-day comparison. The main focus can prioritize short recorded main sleep, a recovery comparison, or a same-day HRV/RHR pattern; it does not diagnose conditions or clear exercise.

Sleep context uses the [CDC general adult sleep reference](https://www.cdc.gov/sleep/about/) of at least seven hours, explicitly labeled general guidance, not an individualized sleep target or a sleep-debt calculation. WHOOP main sleep excludes naps; the UI says so. Reaching seven hours does not prove adequate quality or individual need. WHOOP Recovery is identified as a composite score, not a percentage of restored energy. Personal HRV/RHR interpretations require sufficient reference observations and use no universal healthy cutoffs.

Sources reviewed 18 October 2026: [WHOOP Recovery](https://www.whoop.com/us/en/thelocker/how-does-whoop-recovery-work-101/), [HRV context](https://www.whoop.com/us/en/thelocker/increase-hrv-heart-rate-variability/), [WHOOP metric definitions](https://www.whoop.com/us/en/thelocker/member-averages-recovery-strain-sleep-hrv/), and CDC above. Guidance is educational, deterministic and context-dependent; a clinician/sports professional review remains open before commercial claims.

### Plain-language comparisons (October 18, 2026)
Reports compare actual median readings on longer/shorter nights, higher/lower previous-day exertion, and more/less consistent sleep. They require seven matched days and at least three observations on each side of the personal median; ties are excluded. Small samples and single-observation sensitivity are explicit. The correlation coefficient is available only in calculation details. These are descriptive comparisons, not causal findings or predictions.
HRV/resting pulse cards show the observed minimum–maximum of the disjoint reference period (at least seven records), not a clinical normal range. Generic actions are collapsed and duplicate definitions removed. Actual-account acceptance and clinical review remain NEEDS TEST.

### Bilingual abbreviation guide
Metric names retain **RHR** and **HRV** in Arabic and English. The header's Abbreviations link opens a bilingual guide for 16 terms and units, including VO₂ max, SpO₂, REM, RMSSD, bpm and ms. Latin abbreviations are isolated left-to-right in RTL. Definition-only entries never imply personal readings are available; VO₂ max and SpO₂ are not currently displayed personal metrics. Definitions checked against WHOOP's [HRV guide](https://www.whoop.com/us/en/thelocker/heart-rate-variability-how-to-read-and-improve-your-hrv/), [VO₂ max guide](https://www.whoop.com/us/en/thelocker/how-accurate-is-whoop-vo2-max/) and [Health Monitor reference](https://support.whoop.com/s/article/WHOOP-Health-Monitor-Report?language=en_US).

### Privacy readiness and current limits
Confirmed disconnect now attempts WHOOP's official [revoke endpoint](https://developer.whoop.com/api/) before local deletion. Only HTTP 204 confirms remote revocation. Expired access, provider/network errors and rate limits do not prevent local erasure; the UI explicitly asks the user to revoke in WHOOP settings if unconfirmed. No live disconnection is used for verification.

Fixture verification covers per-user read/export/status/deletion, forged user IDs/metadata, OAuth state owner/replay, encrypted refresh rotation and rate-limit leases. Live metadata confirms RLS and denied direct browser SELECT/DELETE on the four private tables. These checks do not replace two real-user acceptance or a disposable WHOOP revoke test. Sequential deletion can race with an in-flight sync/callback; transactional coordination remains open. Closed-browser sync, persisted history cursors and operational restore validation also remain open. See the current snapshot at the top of `docs/ANALYTICS-ROADMAP.md`.
