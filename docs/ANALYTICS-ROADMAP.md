# WHOOP Intelligence — Analytics roadmap

## Purpose and safety
Bilingual Arabic/English personal health and sports analytics. The system provides educational wellness interpretations, not medical diagnosis, treatment, ECG interpretation, or fitness clearance. Never infer disease from RHR/HRV/SpO2 alone. Show uncertainty, missingness, calibration, provenance, and trend context.

## Phase 1 — shipped foundation (2026-10-18)
- Separate Supabase project; WHOOP OAuth completed for one account.
- Backend `whoop-data` supports signed-in, user-scoped WHOOP v2 sync (recovery, cycles, sleep, workouts) and reads of saved records.
- Data cache `public.whoop_health_records`: RLS enabled, no anon/authenticated table grants, service-only access.
- Upsert prevents duplicate records; initial manual sync limited to 30 days, 2 pages per category.
- Bilingual analysis screen (`analysis.html`): RHR, HRV, Recovery, Sleep duration, Strain, personal median context, simple interpretation, missing data messaging.
- Caveat: no real sync has yet been completed or validated. Refresh-token rotation and automatic scheduled sync are NOT implemented. 

## Phase 2 — critical reliability
- Validate WHOOP schemas and individual data returned by real sync, including any failures.
- Secure per-user refresh-token locks and atomic rotation, 401/429 backoff and resuming after interruptions.
- Incremental pagination, full-history backfill on demand, UTC-aware timestamps and source update tracking.
- Record deletion/disconnect and WHOOP token revoke; authenticated data export and account deletion flow.
- Webhook signature validation plus retry/idempotent processing, manual polling fallback.
- Automated tests for OAuth expiry, missing scope, unavailable score, missing stage summary, duplicate records, RTL, and isolation between users.

## Phase 3 — detailed evidence-based interpretation
- Baseline: 14–30 scored days; display baseline coverage, median, changes and confidence and longer trends.
- Heart health indicators: RHR, HRV, available SpO2 and skin temperature; avoid medical cut-offs unless reviewed against appropriate validated clinical guidelines.
- Recovery + sleep: duration, sleep timing regularity, stage distribution, performance, quality and how changes correlate with recovery.
- Sports: strain by day, workout profiles, load vs recovery, fatigue context and conservative deload suggestions; no automatic 'cleared to train' claims.
- Correlations: historical associations only, minimum data thresholds, avoid causal inference.
- Daily/weekly/monthly reports in plain Arabic and English: observed data, probable explanations, action ideas, limitations and escalation flags.
- Accessible mobile UX, chart labels in both languages, data dictionary and links to source metrics.

## Phase 4 — launch hygiene
- Privacy review and accurate live retention/deletion terms; validated public links.
- Rate-limit monitoring, backfill quotas, encrypted token rotation, alerts and audit log retention.
- Validate all interpretations with qualified clinicians and sports scientists before commercial claims.

## Current known limits
Current access-token expiry can block sync; reconnect is a temporary workaround until atomic refresh is built. Do not claim analysis is medically certified.

## 2026-10-18 implementation update
- Deployed WHOOP data API v2 with OAuth refresh-token rotation, one-user lease via PostgreSQL RPCs, encrypted token replacement and release in finally.
- The refresh protocol is deployed but remains **unverified against a genuinely expired access token**. Refresh can still require reauthorization if WHOOP rotates tokens and a network/database failure occurs between exchange and persistence.
- Manual data sync is available. Background scheduler, webhook verification, full historical backfill, deletion and commercial clinical review remain pending.
- Backend lock expires after 45 seconds; lock prevents most concurrent refresh attempts, while production-strength crash recovery and durable idempotency are additional work.

## 2026-10-18 — Session-based auto-sync
- `analysis.html` now attempts WHOOP synchronization automatically on opening the page and when returning to the tab, if 30 minutes elapsed since the last fully successful manual/automatic sync.
- While the page remains open, a five-minute timer checks whether a sync is due; requests are throttled to a minimum 30-minute interval after a successful sync.
- Partial WHOOP failures are surfaced; they do not count as a successful sync.
- This is **client-session auto-sync only**. It does not run while the browser is closed, and there is no scheduled backend job or cron yet.
- Outstanding: server-driven schedules, validated expired-token refresh, multi-device sync timestamp coordination, pagination completeness, privacy deletion and medical review.

## 2026-10-18 — Privacy controls
- Deployed `whoop-account` Edge Function: authenticated connection status, recent-record JSON export (1,000 record cap), local record + token disconnection.
- Published bilingual `data.html` UI and updated public privacy policy to reflect actual limitations.
- Security: endpoint requires Supabase Auth bearer token, scopes database mutations to `user.id`, never returns OAuth tokens.
- **Important:** remote WHOOP OAuth revocation is NOT yet implemented and export is not exhaustive beyond 1,000 rows.
- Server-side scheduling was evaluated; pg_cron/pg_net were not installed. No scheduled job was deployed without safely provisioned service authentication. Browser-session auto-sync remains the current refresh mechanism.
- Needs verification: actual export, deletion path (prefer disposable test connection rather than real account), server-side schedule authorization, and RLS/security review.

## 2026-10-18 — Data quality update
- Weekly/monthly reports now expose scored-day coverage and warn about incomplete records instead of presenting missing days as normal.
- This is a deployed frontend change; live multi-device browser verification is still pending.
- Upcoming: chronological source-date ordering, server-side pagination, authenticated background schedule, retention and export completeness.
