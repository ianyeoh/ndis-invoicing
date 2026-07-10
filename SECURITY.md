# Security

This document describes the security posture of the NDIS Invoicing tool. It is
a pure-frontend personal tool: a static Next.js app plus NextAuth's own OAuth
routes. There is no application-owned datastore and no application-owned
state-changing API - the only data that ever leaves the browser goes directly
to Google's Drive and Sheets APIs that the user authorises on their own account.

The posture below reflects internal security-governance guidance for
client-side OAuth patterns; it is a documented, conscious trade-off rather than
an accident.

## Client-side OAuth access token: trade-off and residual risk

The app authenticates with Google using the OAuth authorization-code flow. The
resulting Google **access token is placed on the NextAuth session and read in
the browser**, where it is used to call the Google Drive picker and the Sheets
API directly from the client.

**Why this is acceptable here.** This is a pure-frontend tool with no backend
of its own. Keeping the token entirely server-side would require proxying every
Drive/Sheets call through an app-owned backend, which would defeat the point of
the design (no server holding user data) and add an app-owned attack surface.
Governance guidance prefers a fully server-side token over exposing it to the
browser; for this tool the exposure is a deliberate, documented exception.

**Residual risk.** A browser-exposed access token is reachable by any script
running in the page, so it is only as safe as the app's XSS posture and its
third-party dependencies. The token is short-lived and narrowly scoped (Drive
picker + the one spreadsheet the user selects), which limits the blast radius,
but a successful XSS or a compromised dependency could read the token and act on
the user's Drive within that scope until the token expires. Mitigations: keep
dependencies patched, avoid `dangerouslySetInnerHTML`/unsanitised HTML, and
request the narrowest Google scopes that still make the export work.

## Server-side secret

`GOOGLE_CLIENT_SECRET` is **server-only**. It is read via `process.env` inside
the NextAuth route handler (`src/app/api/auth/[...nextauth]/route.ts`) and has
no `NEXT_PUBLIC_` prefix, so Next.js never inlines it into the client bundle.
This is verified after every build by confirming the name does not appear in
`.next/static` (see below). `NEXTAUTH_SECRET` is likewise server-only.

Verification method: after `pnpm run build`, grep the client output -
`grep -r GOOGLE_CLIENT_SECRET .next/static` and
`grep -r NEXTAUTH_SECRET .next/static` must both return nothing. The secrets are
referenced only under `.next/server`.

## CSRF posture

The app exposes **no application-owned state-changing endpoint**. All mutations
(writing rows to a spreadsheet) go straight from the browser to Google's APIs
using the user's own access token, which Google authorises per request - there
is no app-owned session cookie that a cross-site request could ride to change
server state. The only server routes are NextAuth's own (`/api/auth/*`), and
NextAuth provides its own CSRF protection for its sign-in/callback flow. There
is therefore no additional CSRF surface for this app to defend.

## Required environment variables

Server startup validates that the required variables are present and fails fast
with a clear error if any are missing (see `src/lib/env.ts`, invoked at request
time by the auth route). See [`app/.env.example`](app/.env.example) for the full
list and per-variable notes. Summary:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | server-only | Signs/encrypts the NextAuth session JWT. |
| `GOOGLE_CLIENT_SECRET` | server-only | Google OAuth client secret. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | public | Google OAuth client id. |
| `NEXT_PUBLIC_GOOGLE_PICKER_DEVELOPER_KEY` | public | Google Picker API key. |
| `NEXTAUTH_URL` | server-only (optional) | Canonical deployment URL; required by NextAuth in non-localhost production. |

## Reporting

This is a personal tool with no formal disclosure process. Raise any security
concern as an issue on the repository.
