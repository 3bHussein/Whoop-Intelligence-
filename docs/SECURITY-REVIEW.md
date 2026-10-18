# Security review — 2026-10-18

Scope: only `jsfeybhgobmrydcfnyjg`. No other project was modified. Health payloads, user identifiers and credentials are not committed.

## VERIFIED by read-only database inspection

- Original seven public/private tables all have RLS enabled; neither anon nor authenticated has direct SELECT grants. No client policies exist: intentional service-only access, not an invitation to add broad policies.
- New `public.whoop_sync_runs` has RLS, revokes PUBLIC/anon/authenticated privileges and grants only service_role. Verified anon/browser SELECT both false after applying migration `20261018145719`.
- `consume_whoop_oauth_state`, `whoop_claim_refresh` and `whoop_release_refresh` are SECURITY DEFINER, restricted to postgres/service_role, with explicit search_path. No anon/authenticated execute grants were found.
- Tokens remain encrypted as AES-GCM ciphertexts. No token values were read for this review.
- Existing health cache had 138 records for one account at inspection. No records or connections were deleted.

## VERIFIED with safe fixture tests

- All three authenticated endpoints reject absent/invalid bearer tokens before database access.
- Export ignores a caller-supplied user ID and filters to Auth `user.id`; it selects only health-record fields, never token ciphertexts.
- Invalid OAuth states are rejected; source inspection confirms a hashed one-use state is consumed atomically with expiry check.
- Refresh reads credentials after acquiring a lock and conditionally persists under lock ownership; persistence-failure fixture confirms finally releases the lease.
- Production frontend imports no test fixtures; Pages artifact excludes backend/tests/node_modules.

## NEEDS TEST / TODO

- Two independently authenticated real accounts, RLS/API cross-account denial end-to-end, expired real token rotation and replay/expiry OAuth integration tests.
- Disposable-account disconnect including concurrent sync; transactional deletion and a durable deletion tombstone before launch.
- Remote WHOOP `DELETE /developer/v2/user/access` revocation (documented endpoint; deliberately not called against current account), Supabase Auth-account deletion and defined backup-retention procedure.
- Browser SDK is pinned to 2.57.4 but loaded from esm.sh. Self-host a reviewed bundle/CSP before a broader public launch.
- Sync audit rows contain operational metadata, not payloads. Retention/cleanup policy is not configured.
- Supabase advisor reports leaked-password protection disabled. Existing UI uses email links; no paid/auth setting was changed. Review applicable plan and auth policy separately.
- RLS-without-policy INFO results are expected for service-only tables; do not fix them by granting browser access.

Sources: [Supabase auth verification](https://supabase.com/docs/reference/javascript/auth-getuser), [RLS security](https://supabase.com/docs/guides/database/postgres/row-level-security), [WHOOP API](https://developer.whoop.com/api/), [password-security advisor remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Existing migration inventory

| Version | Name |
|---|---|
| 20261018132610 | initialize_whoop_private_storage |
| 20261018134228 | oauth_secure_service_tables |
| 20261018140027 | whoop_health_records_secure_cache |
| 20261018141126 | whoop_refresh_serialization |
| 20261018145719 | whoop_sync_run_monitoring |

The first four migrations predate repository snapshots; their names and live schema/permissions were inspected. Their original SQL is not available through the exposed migration-list tool and has not been invented. Public tables used: pending state (hash/user/expiry), encrypted tokens (user/ciphertexts/expiry/refresh lease), health cache (user/type/source composite PK, payload/source update/fetch timestamps), and V2 sync runs. Legacy `whoop_private` tables are preserved and unused by the current endpoints.
