# WHOOP Intelligence — Development Log

Last updated: 2026-10-18
Repository: https://github.com/3bHussein/Whoop-Intelligence-

## Status meanings
- **DONE (deployed):** code or backend published. Not necessarily fully user-accepted.
- **VERIFIED:** tested against real WHOOP data or observed successful behavior.
- **NEEDS TEST:** code deployed, real-world acceptance not confirmed.
- **TODO:** not implemented.
- **BLOCKED:** a specific dependency prevents progress.

## Delivered / الموجود حاليًا
| ID | Feature | Status | Evidence / Notes |
|---|---|---|---|
| W-001 | WHOOP OAuth connection | VERIFIED | Callback reported success; Supabase check showed one connected account and valid token |
| W-002 | Separate Supabase project/database | DONE (deployed) | `whoop-intelligence`, independent from ProgressXX |
| W-003 | Secure WHOOP data endpoint | DONE (deployed) | User-scoped `whoop-data`; manual sync/read |
| W-004 | Arabic and English analysis page | VERIFIED (initial) | User screenshot showed real RHR/HRV/Recovery/Sleep/Strain; translation and UX not comprehensively tested |
| W-005 | 7/30-day reports | NEEDS TEST | `reports.html` published; real-device QA outstanding |
| W-006 | Personal median and previous-period comparison | NEEDS TEST | Basic period comparison implemented, limited by available records |
| W-007 | Encrypted OAuth token storage | DONE (deployed) | AES-GCM server-side |
| W-008 | Refresh token rotation with lock | NEEDS TEST | Deployed in `whoop-data`; expired-token end-to-end test pending |
| W-009 | Session-based auto-sync | NEEDS TEST | Attempts refresh on page open / visibility, throttled; not server scheduling |
| W-010 | Data export and local deletion | NEEDS TEST | `data.html`, `whoop-account`; export capped 1,000 records; revocation at WHOOP not verified |
| W-011 | Data coverage warnings in reports | DONE (deployed) | Show missing days and insufficient comparison readings |

## Prioritized roadmap / المطلوب وما تبقى
| Priority | ID | Task | Status | Acceptance criteria |
|---|---|---|---|---|
| P0 | P-001 | Redesign Overview mobile-first in a polished WHOOP-inspired but original visual system | VERIFIED | Arabic RTL/English LTR, clear hierarchy, polished responsive cards and charts |
| P0 | P-002 | Personal insight engine, never generic filler | VERIFIED | Every claim cites actual record window, calculated values, comparison and data-coverage confidence; no data = explicit insufficient evidence |
| P0 | P-003 | Trend charts and timeline based on measurement date rather than fetch date | VERIFIED | 7/30-day trend visualization for RHR, HRV, sleep, strain, recovery; correct chronological sorting |
| P0 | P-004 | Verify paginated sync and refresh on real user data | NEEDS TEST | Check API errors, duplicates, gap days, expiries and rotation |
| P0 | P-005 | Comprehensive health + training insight design | TODO | Clear, personalized explanations, no unsupported diagnostic claims, conservative training guidance |
| P1 | P-006 | 24/7 secure server-side scheduler | BLOCKED | Need authenticated server scheduler, safe credentials, lock, backoff, audit, monitoring; `pg_cron`/`pg_net` currently unavailable |
| P1 | P-007 | Sleep + recovery + training correlations | VERIFIED | Joined dates, minimum sample sizes, uncertainty, no causal claims |
| P1 | P-008 | Reports redesign, shareable PDF / print | DONE | Mobile polished weekly/monthly reports with metric provenance |
| P1 | P-009 | Full-history backfill, complete pagination and safe rate limits | TODO | Works past 30-day cap with reliable resume |
| P1 | P-010 | Complete export and WHOOP OAuth revocation | TODO | Full downloadable history and verifiable disconnect/revoke |
| P1 | P-011 | Clinical/sports domain expert review | TODO | Review safety, definitions, thresholds, disclaimers before production release |
| P1 | P-012 | Automated RTL, mobile, auth, browser, analytics and regression tests | VERIFIED | Passing CI and manual Android acceptance |
| P2 | P-013 | Webhook-driven event sync | TODO | Signature verification, idempotency, retries and documented scopes |
| P2 | P-014 | Settings, accessibility, performance improvements | DONE | Localized settings, chart accessibility and performance QA |

## Analytics requirements — strict personalized approach
- Never show fabricated demo values as real metrics.
- Each interpretation must use user-specific data, measurement timestamp and data source.
- Compute 7-day vs prior 7-day and 30-day vs prior 30-day baselines with counts.
- Label insufficient days; avoid universal "good/bad" thresholds for HRV or RHR.
- Distinguish observation, possible explanation, and action guidance.
- Correlation is not proof of causation; never claim to diagnose a disease or medically clear training.
- Show freshness, missingness and confidence directly in the UI.

## Change log
- 2026-10-18: Created this log; consolidated verified work, deployed-but-untested features, and prioritized V2 UI + personalized analytics roadmap.
- Prior releases: see `docs/ANALYTICS-ROADMAP.md`.

## Rules for future changes
1. Update this file for every meaningful code/DB/UX change.
2. Move an item to DONE only after the code is deployed; mark VERIFIED only after tests/evidence.
3. Record relevant commit IDs, tests run, failures, and outstanding risks.
4. Keep ProgressXX untouched.

- 2026-10-18: V2 first UI iteration deployed to main (`cfd96de`): refined responsive cards and added a personalized overview using saved WHOOP recovery measurements, previous medians and sample-size warning. **NEEDS TEST:** verify mobile RTL, real record chronology and full history coverage; does not yet constitute a complete personal insight engine.

- 2026-10-18: Added responsive 7/30-day RHR, HRV and Recovery timeline charts to analysis.html (commit 295a4e3). Deployed, with browser validation pending.

- 2026-10-18: Implemented initial per-account sleep vs Recovery association on analysis.html (commit 433982b). Matches sleep end and recovery dates in UTC, excludes naps, requires 7 matched dates and nonzero variance. Correlation is descriptive, not causal. NEEDS TEST: WHOOP timestamps and timezone alignment, duplicated days, real-user browser QA; no inference if insufficient observations.

- 2026-10-18: Deployed a personalized prior-day Strain vs next-day Recovery association (commit d78d0e2). Requires >=7 valid daily pairs. Uses UTC matching, so remains NEEDS TEST for WHOOP timezone correctness, user-data browser behavior, and interpretation; no causal or clinical claims.

## V2 implementation batch — 2026-10-18

Implementation commit: `b6f526e` (dashboard + analytics + protocol + tests; followed by documentation/release commits).

| Area | Status | Evidence |
|---|---|---|
| Eight-section responsive redesign | VERIFIED | Executed Chromium fixture tests at 390/1440 px in AR/EN, navigation, no page overflow, charts, table, sync and anonymous state; screenshot inspected |
| Pure personalized analytics | VERIFIED | Executed calculation fixtures, median/baseline/coverage, 7/30 calendar windows, source chronology, exact lag alignment, missingness and sample safeguards |
| Five relationships | VERIFIED | Fixture correlation/alignment tests; minimum 7 variable pairs, no causal claims, leave-one-out sensitivity warning; not clinically validated |
| Sleep duration/efficiency | VERIFIED | Source-stage or bed/awake/no-signal calculation; no fabricated missing values; efficiency source-only |
| Sync protocol | VERIFIED | Fixtures traverse >2 pages, detect cursor cycles, surface caps/401, honor short Retry-After and stop on long limits |
| Refresh rotation | NEEDS TEST | Runtime fixture verifies fresh credential under lock, owner check, persistence-failure release; genuinely expired WHOOP token not tested |
| Service-only sync history | DONE | Migration `20261018145719` applied; RLS + denied browser grants checked live; concurrent sync run uniqueness and abandoned-run cleanup implemented |
| Export | VERIFIED | Fixture reads 1,203 rows beyond old 1,000 cap; Auth user scope tested; live export not performed |
| Privacy text/account UI | DONE | Corrected stale claims, bilingual policy/account, versioned source; destructive flow not executed |
| Background scheduler/webhooks | BLOCKED | pg_cron/pg_net absent; no provisioned scheduler authentication/webhook secret; existing session-only polling retained |
| Full historical backfill | TODO | 62-day repair + bounded overlap implemented; unlimited history and persistent cursor resume remain |
| Remote revoke / transactional deletion | TODO | Preserve existing account; needs disposable connection and concurrency-safe transaction/tombstone design |

Executed locally: **26 Node tests PASS; 5 Chromium browser scenarios PASS**. These are fixture tests, not proof of real-account acceptance. Cross-browser local run encountered unavailable host dependencies; Firefox/WebKit validation is delegated to the new GitHub Actions workflow, with actual results to be recorded below. Local dependency installation failed due container uid/setgroups restrictions. No test is labeled PASS merely because it was written.

Significant fixes: replaced `created_at`/UTC approximations with cycle/sleep IDs and recorded offsets; removed arbitrary recovery interpretation buckets; missing chart days remain gaps; source-only efficiency; authenticated read errors no longer silently become empty arrays; export no longer silently truncates at 1,000; refresh re-reads under the lease and reuses already-renewed access; sync failures do not advance client freshness. Static deployment now publishes only public assets.

Database security inspection: original 7/7 tables had RLS and no anon/authenticated SELECT grants; the new eighth sync table matches that service-only design. Advisor's RLS/no-policy INFO notices are expected; leaked-password-protection WARN is documented without changing auth settings. No current health records, tokens, or connections were deleted. Other projects untouched.

Remaining priorities: verify PR CI; deploy checked data/account functions; perform non-destructive unauthenticated denial checks; merge only after required CI; confirm Pages deployment. Then real-account acceptance (fresh read/sync, genuine expiry), disposable deletion, remote revoke, scheduled auth, complete history/resume, Android acceptance and clinical review. Statuses below supersede older historical claims.

### Publication and backend verification

- GitHub terminal push lacked credentials; published the identical reviewed tree through the GitHub connector as remote implementation commit `64276fe3a0b5b2af5333c8853cd3c1c9d623772d`. The earlier `b6f526e` reference is a local checkpoint, not a remote commit. PR: https://github.com/3bHussein/Whoop-Intelligence-/pull/1.
- Deployed `whoop-data` **v3** and `whoop-account` **v2** to the named project; start/callback remain their existing deployed versions. Existing encrypted credentials were preserved.
- **VERIFIED live:** missing bearer and deliberately invalid bearer return HTTP 401 on all three authenticated endpoints (six requests executed). No authenticated user was impersonated; no real health export/disconnect request was sent.
- Migration history and advisors rechecked: new sync table has RLS=true, anon SELECT=false, authenticated SELECT=false. Scheduler/webhook and destructive acceptance remain open.
- Follow-up hardening clears in-memory personal records when authenticated account identity changes. Added browser checks for bilingual email-link form, privacy language and rejection of an unexpected OAuth redirect host. Job timeouts prevent unbounded CI runs.

## Release evidence — WHOOP Intelligence V2

- **DONE / production:** PR #1 merged as `d9fe9735c035abaf2f1b3b472d2d536a7c1f3578`; implementation `64276fe3a0b5b2af5333c8853cd3c1c9d623772d`; account-state/browser hardening `5a0cdcf3a004e5d238d6d9c0533abf9ef30609bd`.
- **VERIFIED:** [final PR CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39138835902): 26 Node tests and **21 executed browser scenarios across Chromium/Firefox/WebKit**, including mobile/desktop AR/EN, anonymous behavior, sign-in form and OAuth host validation.
- **VERIFIED:** [merged-main CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39138948214) succeeded.
- **VERIFIED:** [Pages deployment](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39138948237) succeeded. Nine public HTML/JS/CSS files were fetched from production with HTTP 200 and byte-hash equality against the tested source. Pinned browser SDK independently returned HTTP 200.
- **VERIFIED live source shape:** all 30 stored recovery records match both sleep_id and cycle_id; none of those matched sleeps is a nap; all have the three scored sleep-stage fields. This was an aggregate-only read, not publication of personal health values. No-signal field was absent, reinforcing the use of actual stage totals rather than assuming missing signal time is zero.
- Mobile RTL screenshot visually reviewed after responsive tests. A real signed-in browser session and actual Android device acceptance are still **NEEDS TEST**; fixture tests do not prove the current account's full 62-day sync or true expired-token rotation.
- No destructive live tests, disconnection, real OAuth revocation or cross-project changes were performed. Refresh-failure-before-sync monitoring, persistent resume, transactional deletion, backup retention and clinical review remain open. The sync history covers API sync attempts after successful token preparation; it is not a complete authentication audit.

### Delivery links

[Production dashboard](https://3bhussein.github.io/Whoop-Intelligence-/analysis.html) · [Merged PR](https://github.com/3bHussein/Whoop-Intelligence-/pull/1) · [Security review](SECURITY-REVIEW.md) · [Current roadmap](ANALYTICS-ROADMAP.md).

## Simple / Advanced presentation batch — 2026-10-18

User feedback: the design works well, but statistical detail is overwhelming without specialist knowledge.

- **DONE:** Simple is the new default. Three overview cards (Recovery, Sleep, Strain), a short personal recovery comparison, period labels and plain metric definitions. No charts or correlation coefficients appear in Simple.
- **DONE:** Calculation evidence expands only on request and retains actual latest/baseline values, differences, dates and sample counts. Insufficient/stale readings cannot produce a positive/negative interpretation. Labels explicitly distinguish latest-reading comparisons from the displayed period median.
- **DONE:** Advanced restores the complete charts/relationships/insights and adds period means. Display selection persists across reload, language and page navigation, with accessible pressed-state controls.
- **VERIFIED locally:** 30 Node tests passed (26 existing + 4 presentation tests); 7 Chromium scenarios passed, extended to check default Simple, at most three overview cards, hidden charts, closed evidence, mode persistence, restored Advanced and bilingual behavior.
- **NEEDS TEST:** PR cross-browser CI and final deployment; real Android acceptance. No medical readiness recommendations or new universal thresholds introduced. WHOOP credentials, health records and database untouched.

### Simple/Advanced release verification

- **VERIFIED:** implementation `0f1f61176d8ed183246b92b78414706f9ef1af86`; [PR #2](https://github.com/3bHussein/Whoop-Intelligence-/pull/2) merged as `f11e4b5c7b00a2599fcfa1f16f70adf1faea7277`.
- **VERIFIED:** [PR CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39140053190) passed: 30 Node tests and 21 browser scenarios across Chromium, Firefox and WebKit. Tests cover Simple default, hidden charts/collapsed evidence, persistent mode and language, Advanced chart restoration, navigation, anonymous state and existing auth regressions.
- **DONE / VERIFIED:** [Pages deployment](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39140231870) succeeded. Production analysis page, dashboard module and new presentation module fetched with HTTP 200 and exact local-source hash matches.
- Mobile Arabic screenshot visually inspected. **NEEDS TEST:** real Android/user acceptance of simplified wording; backend real-token/deletion/scheduler blockers remain documented separately. No backend or database changes in this batch.

## Daily reports / redesigned report batch — 2026-10-18

- **DONE:** New report layout for Today, 7 days and 30 days, with distinct cover, local date, key-reading availability, three primary cards and collapsible cardiovascular/sleep detail. Supports Simple/Advanced and print/PDF presentation.
- **DONE:** Daily report uses exactly today's WHOOP-local measurements, never the most recent old reading. Compares to median of preceding 30 calendar days, excluding today, minimum seven observations. Unscored strain remains missing; ongoing-day note avoids implying the day is final. Missing offset is explicitly labeled UTC.
- **DONE:** Weekly/monthly report compares period medians against previous equal-length windows (at least three observations each). Difference labels use percentage points where appropriate. Source times/counts remain available in expandable evidence.
- **VERIFIED locally:** 37 Node tests PASS (seven new report-model tests), 7 extended Chromium browser scenarios PASS before final documentation. Includes today selection, both modes, print control visibility, local-midnight alignment, missing today, partial scores and insufficient baseline. Browser clock fixed to fixture date to prevent calendar-dependent regressions.
- **NEEDS TEST:** PR cross-browser CI, deployment and real Android acceptance. No backend, authentication, credential or database changes.

### Daily-report release evidence

- **VERIFIED:** code `c308538766eccf65826b84fd7fe5d3188459c72d`, [PR #3](https://github.com/3bHussein/Whoop-Intelligence-/pull/3), merge `e12d367254add45b4e383905a5ad7ca819fecfc9`.
- **VERIFIED:** [PR CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39141456638) executed 37 Node tests and 21 browser scenarios across Chromium/Firefox/WebKit successfully, including daily direct URL, print visibility, both presentation modes and mobile RTL/LTR.
- **DONE / VERIFIED:** [Pages deployment](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39141590049) succeeded. Five changed public HTML/JS/CSS files fetched with HTTP 200 and exact source hashes; daily query entry also returned HTTP 200.
- Arabic mobile report screenshot visually reviewed. Fixture verification is not real-account or physical Android acceptance; those remain **NEEDS TEST**. No health data, credentials or backend state modified.

## Meaning-first interpretation batch — 2026-10-18

User feedback: definitions and higher/lower labels still did not explain the meaning of personal readings.

- **DONE:** Visible data-triggered meaning and practical-action blocks for sleep, recovery, HRV, resting pulse, strain, efficiency and consistency, in Arabic and English. Same engine in Simple cards, Advanced interpretations and reports.
- **DONE:** Fixed mixed-window comparison: the card's displayed period median is now compared with its own previous window, not with a separate latest reading. Daily uses its prior 30-day baseline and sample safeguards.
- **DONE:** Main focus can highlight short main sleep even when improved from personal history; eligible combined HRV-down/RHR-up context is limited to the same day. Neither improvement nor reaching a general sleep reference is presented as training clearance or proof of enough recovery.
- **DONE:** Source-linked CDC general adult sleep reference, clearly separated from individual need and 24-hour sleep including naps. Recovery is explained as WHOOP's composite score, not literal restored-body/energy percentage. No universal HRV/RHR cutoffs introduced.
- **VERIFIED locally:** 46 Node tests and 7 Chromium scenarios passed, including the final composite-reference regression test. Includes opposing latest-vs-median direction, insufficient history, short-but-improved sleep, missing data, contextual strain and bilingual rules. UI asserts visible meaning/actions and absence of the mismatched latest-reading label.
- **NEEDS TEST:** Cross-browser CI, deployment and real user acceptance. Source review references are in README. Clinical/sports expert review remains open. No backend, credential or health-data mutation.

### Meaning-first release evidence

- **VERIFIED:** implementation `d5b1edf82cc718f15e7e2a9e16c59cb44ab6c018`, evidence-summary follow-up `6e0468dc67d3c6870f10cc44da52314f14939d85`, [PR #4](https://github.com/3bHussein/Whoop-Intelligence-/pull/4), merge `bfff3544df2652f22990152614f42710d8d2ce23`.
- **VERIFIED:** [PR CI](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39142908610) passed 46 Node tests and 21 browser scenarios across Chromium, Firefox and WebKit. Includes visible meaning/actions, consistent period comparisons, eligibility and existing auth/mobile/report regressions.
- **DONE / VERIFIED:** [Pages deployment](https://github.com/3bHussein/Whoop-Intelligence-/actions/runs/39143092537) succeeded. Production dashboard, meaning module and stylesheet fetched with HTTP 200 and exact source hashes.
- Arabic mobile interpretation card visually inspected. **NEEDS TEST:** user acceptance and qualified clinical/sports review. Rule-based educational meanings do not establish causation, diagnose illness, infer individual sleep need or clear exercise. Source/reference links remain visible. No backend or health-data mutations.

## 2026-10-18 — Understandable observed comparisons
- DONE: Replaced r-first relationship cards with actual higher/lower-group median values and counts. Seven matched days and three observations each side required; ties excluded. Coefficients retained in collapsed calculation details; preliminary/sensitive results clearly qualified.
- DONE: HRV/resting pulse show earlier observed minimum–maximum with reference count; this is explicitly a historical range, never a medical normal range. Individual directional changes no longer get an attention color on their own. Removed duplicate metric definitions and collapsed generic action paragraphs.
- VERIFIED locally: 52 Node tests, 7 Chromium browser scenarios including bilingual relationship rendering and hidden technical details. Arabic mobile sleep-card screenshot inspected. No backend changes, credentials or account-data mutations.
- NEEDS TEST: Cross-browser CI, deployment, real-account acceptance and clinical/sports review. Prior integration blockers remain unchanged.
