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
| P0 | P-001 | Redesign Overview mobile-first in a polished WHOOP-inspired but original visual system | IN PROGRESS | Arabic RTL/English LTR, clear hierarchy, polished responsive cards and charts |
| P0 | P-002 | Personal insight engine, never generic filler | IN PROGRESS | Every claim cites actual record window, calculated values, comparison and data-coverage confidence; no data = explicit insufficient evidence |
| P0 | P-003 | Trend charts and timeline based on measurement date rather than fetch date | TODO | 7/30-day trend visualization for RHR, HRV, sleep, strain, recovery; correct chronological sorting |
| P0 | P-004 | Verify paginated sync and refresh on real user data | NEEDS TEST | Check API errors, duplicates, gap days, expiries and rotation |
| P0 | P-005 | Comprehensive health + training insight design | TODO | Clear, personalized explanations, no unsupported diagnostic claims, conservative training guidance |
| P1 | P-006 | 24/7 secure server-side scheduler | BLOCKED | Need authenticated server scheduler, safe credentials, lock, backoff, audit, monitoring; `pg_cron`/`pg_net` currently unavailable |
| P1 | P-007 | Sleep + recovery + training correlations | TODO | Joined dates, minimum sample sizes, uncertainty, no causal claims |
| P1 | P-008 | Reports redesign, shareable PDF / print | TODO | Mobile polished weekly/monthly reports with metric provenance |
| P1 | P-009 | Full-history backfill, complete pagination and safe rate limits | TODO | Works past 30-day cap with reliable resume |
| P1 | P-010 | Complete export and WHOOP OAuth revocation | TODO | Full downloadable history and verifiable disconnect/revoke |
| P1 | P-011 | Clinical/sports domain expert review | TODO | Review safety, definitions, thresholds, disclaimers before production release |
| P1 | P-012 | Automated RTL, mobile, auth, browser, analytics and regression tests | TODO | Passing CI and manual Android acceptance |
| P2 | P-013 | Webhook-driven event sync | TODO | Signature verification, idempotency, retries and documented scopes |
| P2 | P-014 | Settings, accessibility, performance improvements | TODO | Localized settings, chart accessibility and performance QA |

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
