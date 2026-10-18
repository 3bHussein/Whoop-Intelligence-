# WHOOP Intelligence

Independent personal wellness analytics application — in development.

## Public pages
- [Landing page](https://3bhussein.github.io/Whoop-Intelligence-/)
- [Privacy policy](https://3bhussein.github.io/Whoop-Intelligence-/privacy.html)

Pages links work after GitHub Pages deploys successfully.

## Backend
Supabase project: `whoop-intelligence`, independent of ProgressXX.

WHOOP OAuth callback:
`https://jsfeybhgobmrydcfnyjg.supabase.co/functions/v1/whoop-callback`

**Important:** Callback is currently a 503 placeholder; WHOOP authorization and synchronization are not enabled. Never commit API credentials, refresh tokens or health data.

## Next
Configure WHOOP Developer application and its scopes, enable a secure OAuth flow with one-time user-bound state, exchange codes, encrypt and rotate tokens, and test authenticated synchronization and deletion.

## Deployment
GitHub Actions workflow `.github/workflows/pages.yml`. Under GitHub repository Settings > Pages select GitHub Actions as the source.

## Integration verification — 2026-10-18
WHOOP Developer Sandbox application exists. User screenshots confirm the six read scopes are enabled; rate limits shown: 100 requests/minute and 10,000/day. Redirect URI has been registered. Edge Function `whoop-callback` is still a non-operational placeholder; **do not start OAuth** yet.

### Security prerequisites before enabling Connect
1. A verified Supabase Auth user session must start OAuth on an authenticated endpoint.
2. Store a short-lived, one-use, account-bound OAuth state; reject missing/expired/replayed states.
3. Request `offline` scope for refresh-token issuance.
4. Use WHOOP credentials only server-side; encrypt access and refresh tokens with an independently generated secret.
5. Rotate refresh tokens atomically under a per-user lock; retry with rate-limit awareness.
6. Provide disconnect/revocation and deletion flows before collecting real health records.
7. Verify the published privacy URL returns HTTP 200 to the public.

Privacy URL publication could not yet be independently confirmed.

## Project status and development tracking

See [Development Log](docs/DEVELOPMENT-LOG.md) for completed, unverified, blocked and planned features, and [Analytics Roadmap](docs/ANALYTICS-ROADMAP.md) for detailed implementation notes. Each meaningful change should update the log with test results.
