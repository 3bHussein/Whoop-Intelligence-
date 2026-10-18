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
