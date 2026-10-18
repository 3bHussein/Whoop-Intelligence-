# WHOOP Intelligence — Analytics roadmap

## Current completion snapshot — 2026-10-18 privacy batch
This snapshot supersedes historical statements below; VERIFIED always names its scope.

| Area | Status | Remaining work |
|---|---|---|
| Bilingual dashboard, simple/advanced, today/weekly/monthly reports, glossary | VERIFIED | Real Android/user acceptance |
| Personal statistics and descriptive group comparisons | VERIFIED (fixtures) | Qualified clinical/sports review; no medical certification claimed |
| User isolation, OAuth state owner/replay and encrypted storage | VERIFIED (handler fixtures + live grant metadata) | Two genuine disposable authenticated accounts against deployed APIs |
| Refresh rotation/lease and rate limits | VERIFIED (fixtures) | Genuine expired WHOOP credential end-to-end; crash-between-rotation-and-persistence recovery |
| Export, confirmed local deletion and remote revoke response handling | DONE; fixture VERIFIED | Live disposable WHOOP revoke/deletion; transactional deletion versus in-flight sync |
| Closed-browser synchronization | BLOCKED | Secure authenticated scheduler provisioning |
| Resumable full history / webhooks / operational alerts / restore drill | TODO | Persisted cursor, authenticity/retry, alerting/retention and backup recovery |
| Public multi-user launch | TODO | Finish real-account acceptance, privacy/retention review and confirm WHOOP app tier |

Next order: disposable-account acceptance → sync/deletion concurrency → secure scheduler → resumable history and operations. Never delete/disconnect the owner's existing account for tests.


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

## 2026-10-18 — Period comparisons
- Reports now compare median RHR, HRV and Recovery of the selected 7/30-day period with the immediately preceding equal-length window.
- Minimum 3 readings per window per indicator; otherwise state data are insufficient rather than implying trends.
- Updated main branch; on-device verification and server scheduling are still pending.

## V2 checkpoint — 2026-10-18 (supersedes historical limits above)

| Milestone | Status | Delivered / remainder |
|---|---|---|
| M1 — Responsive bilingual product | VERIFIED | Eight sections, dark mobile/desktop layout, RTL/LTR, mobile navigation, loading, accessible timelines/tables; Chromium fixtures pass; real Android acceptance pending |
| M2 — Personal evidence engine | VERIFIED | Pure engine, source IDs/local offsets, 7/30 statistics, prior-window differences, baselines, sample sizes, missingness/timestamps; no generic text presented as a personal diagnosis |
| M3 — Five associations | VERIFIED | Same-cycle sleep/recovery/HRV/consistency plus exact prior calendar-day strain pairs; variation/minimum samples and outlier sensitivity; fixture validation, not clinical validation |
| M4 — Integration resilience | NEEDS TEST | Bounded complete pagination, 62-day repair, recent overlap, explicit failure, fresh-token lease check, per-user run history; real expiry/backfill acceptance pending |
| M5 — Privacy/security | NEEDS TEST | Service-only grants/RLS verified, user-scoped handlers, paginated export fixtures, accurate bilingual privacy; disposable deletion, remote revoke and login deletion remain |
| M6 — Automated quality | NEEDS TEST | 26 local Node tests + 5 Chromium scenarios pass; GitHub cross-browser workflow and Pages test gate added; CI results tracked in Development Log |
| M7 — Closed-browser sync | BLOCKED | No cron/net or configured authenticated scheduler; do not claim 24/7 sync |
| M8 — Launch review | TODO | Persistent backfill resume, webhook authenticity, monitoring alerts/retention, transactional deletion, provider backup policy, qualified clinical/sports review |

### Calculation contract

- Periods end on the current date using the latest available recorded WHOOP offset (UTC date only if none exists); source daily observations retain each record's own offset. Travel/DST can produce duplicate local dates: one newest daily observation is retained; days are never multiplied to inflate sample size.
- Recovery joins `cycle_id`; main sleep joins `sleep_id`. Sleep can appear without a scored recovery using its own cycle/end and offset. No guessed nearest-date matching.
- Baseline is the median of the 30 calendar days before the latest measurement, excluding that latest value; personal differences require seven baseline observations. Period comparison requires three observations in each disjoint equal-length window; this is a descriptive display rule, not medical significance.
- Correlation requires at least seven pairs and nonzero variance. No significance/predictive claim is made. Outliers are retained, with leave-one-out coefficient sensitivity warning for eligible samples. No unvalidated clinical thresholds or exercise-clearance recommendation.
- Sleep uses summed light/slow-wave/REM stages when available; otherwise bed minus awake minus no-signal time only if all fields exist and are valid. WHOOP efficiency and consistency percentages are source fields, not invented estimates.
- Baselines, means and medians are computed from the authenticated account's cache; no fixture data ships in the public artifact. A field missing on a scored record remains missing.

### Integration limits

The dashboard/export read pagination cap is 20,000 rows (per type for dashboard), explicit error on overflow. Sync caps each type at 20 pages with a shared 70-second budget; caps/repeated cursor/rate limits are surfaced as incomplete, not success. Resuming an incomplete full repair currently means rerunning manual sync; there is no persisted pagination cursor. Sync-history rows begin at V2 and are not a retroactive log of prior operations. A stale running row is abandoned after two minutes on the next sync attempt. A crash after WHOOP refresh rotation but before persistence may still require reauthorization.

### Release validation

M6 automated quality is now **VERIFIED** for the executed fixture suite: 26 Node tests and 21 browser scenarios, all three engines, [successful PR CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39138835902). M1 public deployment is **DONE / VERIFIED** via successful [Pages run](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39138948237) and exact production asset hashes. These results do not close real-account expiry/deletion, physical Android acceptance or clinical review. Current source is merged through PR #1; detailed hashes/results are in Development Log.

## Plain-language experience — 2026-10-18

- **DONE:** Simple/Advanced display switch with Simple default and persistent browser preference. Overview has three key metrics; section-specific simple views have at most three cards.
- **DONE:** Short data-derived recovery summary, plain metric definitions, readable hours/minutes, and collapsed calculation evidence. Latest-reading comparisons are explicitly labeled separately from period-typical values.
- **DONE:** Advanced mode retains the complete analysis and now also displays period means next to medians. Settings/export/deletion remain accessible in both modes.
- **NEEDS TEST:** Real Android acceptance of text density and terminology. Automated test evidence and publication status are tracked in Development Log.
- No backend/auth/database modification is included in this presentation update. Existing scheduler, remote revocation and destructive acceptance blockers remain unchanged.

Simple/Advanced is now **DONE / VERIFIED** by [PR #2 CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39140053190) (30 Node tests / 21 three-engine browser scenarios), successful Pages deployment and production asset hashes. Physical-device acceptance remains **NEEDS TEST**.

## Daily report and report design — 2026-10-18

- **DONE:** Dedicated report cover, date, key-metric completeness, Recovery/Sleep/Strain cards, collapsible heart/sleep details, print controls and print styling in AR/EN.
- **DONE:** Today / 7 / 30 day selector and overview shortcut. Direct daily URL: `analysis.html?period=1#reports`.
- **VERIFIED (fixtures):** Daily observations match exactly today's source-local date; prior 30-day baseline excludes today and needs seven earlier observations. No historic reading substituted for missing today. Weekly/monthly compare disjoint periods with minimum three observations each.
- **DONE:** Same-day provisional-load note, missing/partial warnings, per-metric source times, confidence through sample evidence, percentage-point difference labels, explicit UTC fallback if source offset is unavailable.
- **NEEDS TEST:** Cross-browser CI/deployment and real-account Android acceptance. Scheduler/token-expiry/destructive testing remain separate open tasks.

Daily/report design is now **DONE / VERIFIED** through [PR #3 CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39141456638) (37 Node tests, 21 cross-browser scenarios), successful Pages deployment and production hash verification. Daily entry: [today's report](https://3bhussein.github.io/Whoop-Intelligence-/analysis.html?period=1#reports). Physical-device/real-account acceptance remains **NEEDS TEST**.

## Meaningful interpretations — 2026-10-18

- **DONE:** Visible "What this means" and "Practical next step" for every simple metric and report card; advanced interpretation uses the same engine.
- **DONE:** Corrected period-median/latest-reading mismatch reported in screenshots. The displayed value, reference, difference and explanation now share the same report window.
- **DONE:** Personal focus prioritizes recorded short main sleep or eligible same-day HRV/RHR context; recovery percentage is explained as a composite score, not literal percent restoration.
- **DONE:** General CDC adult sleep reference is separated from personal baseline/need, with explicit main-sleep/naps limitation. HRV/RHR use no invented universal cutoffs. Guidance does not diagnose or provide exercise clearance.
- **NEEDS TEST:** Cross-browser release CI and user acceptance. Qualified clinical/sports review remains open; explanatory rules are educational and source-linked, not a validated medical decision system.

Meaning-first interpretation is now **DONE / VERIFIED** by [PR #4 CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39142908610) (46 Node tests and 21 cross-browser scenarios), successful deployment and production hash checks. User acceptance and qualified clinical/sports review remain **NEEDS TEST**.

### Plain personal findings follow-up
- DONE: Replace prominent correlation jargon with observed two-group median comparisons, actual values, group counts and plain-language direction.
- DONE: Require 7 matched days and 3 per group; exclude median ties; preserve exact preceding-day alignment and sensitivity caveats.
- DONE: Personal historical range for HRV/RHR with no clinical normality claim; neutral single-metric changes, collapsed generic actions, remove repeated definitions.
- VERIFIED locally: 52 Node tests and 7 Chromium scenarios. Cross-browser CI/deployment NEEDS TEST until release evidence is recorded.
- NEEDS TEST: Real-account Arabic mobile acceptance and qualified interpretation review. Existing backend/scheduler blockers unchanged.
- VERIFIED release: PR #5 / implementation `08ba631568cdedf5ed3ef3adc0c9e490b370b8c2`; 52 Node tests and 21 cross-browser scenarios passed in run `39144217437`. Pages run `39144387373` succeeded; production assets matched source hashes. Real-account acceptance remains NEEDS TEST.

### Abbreviations in both languages
- DONE: RHR/HRV retained beside translated labels; accessible header link to a collapsed bilingual 16-term/unit guide; Latin text uses LTR isolation in Arabic.
- DONE: VO₂ max and SpO₂ defined with explicit unavailability, no invented readings or new analytics.
- VERIFIED locally: 55 Node tests and 7 Chromium scenarios; CI/deployment NEEDS TEST until release evidence below.
- VERIFIED release: implementation `8b8b1ababa956a150b0dc567a8c647796df085b1`, PR #6; CI `39144889744` passed 55 Node tests / 21 browser scenarios; Pages `39145040195` succeeded with production source hash verification. User acceptance remains NEEDS TEST.


## Privacy and isolation verification batch
- DONE: Confirmed disconnect attempts the official WHOOP DELETE /developer/v2/user/access with a valid stored access token before local erasure. Only HTTP 204 confirms remote revocation; expired/rejected/rate-limited/network outcomes remain explicitly unverified, with manual WHOOP-settings instructions.
- DONE: Pending OAuth-state deletion errors no longer report success. Privacy UI preserves outcome text after status refresh, with bilingual success/manual-action messaging.
- VERIFIED locally: 69 Node tests / 9 Chromium scenarios. Includes forged owner/metadata, scoped read/status/export/delete, encrypted OAuth owner binding/replay, successful encrypted refresh rotation and lease/rate-limit behavior, download/cancel/revoke-result UI. All destructive paths are fixtures only.
- VERIFIED live (read-only metadata): RLS enabled; anon/authenticated SELECT and DELETE denied on health records, OAuth tokens/pending and sync history.
- NEEDS TEST: CI/deployment, two real users, genuine expiry and disposable WHOOP revoke/deletion. Deletion is still sequential, not transactional; in-flight sync/callback races remain open.
- VERIFIED release: PR #7 / `bee1d304eaa267556048145873d29a2185dcb0d5`; CI `39145771031` passed 69 Node tests and 27 cross-browser scenarios; whoop-account v3 deployed with matching source and live missing/invalid bearer 401 checks; Pages `39145940673` succeeded with exact privacy-page hash checks. Live destructive/multi-user/expiry acceptance remains NEEDS TEST.

## Connected daily analysis — WHOOP-only scope
- DONE: Daily synthesis of main sleep/recovery/HRV/RHR; combined, mixed, repeated, typical-change and insufficient-data states; actual HRV/RHR evidence visible beside the summary.
- DONE: Each day's own prior-30-day baseline, at least 7 observations; 3-day persistence requires actual adjacent dates. Typical change uses at least 7 exact adjacent differences. Source gaps never bridge; displayed precision controls size comparison.
- DONE: Prior-day strain context, missing-today handling, bilingual calculation explanation. Recovery/HRV/RHR dependencies are explicit rather than counted as independent evidence.
- DONE: Per user instruction, manual context/journaling removed from planned scope; rely on existing WHOOP records. Never infer caffeine, fatigue, nutrition, illness or cause.
- VERIFIED locally: 78 Node tests and 9 Chromium scenarios. CI/deployment NEEDS TEST until release evidence below. Clinical review and real-account acceptance remain open.
- TODO: Deeper available sleep timing/stages and workout-level analysis; stronger period report highlights. Existing reliability/launch blockers unchanged.
- VERIFIED release: PR #8 / `2612ff4136f1f0e71a427918e8bfcb475a6e4801`; CI `39146736735` passed 78 Node tests / 27 browser scenarios. Pages `39146906844` succeeded with production JS/CSS source hashes. WHOOP-only scope is DONE; real-account acceptance and qualified review remain NEEDS TEST.
