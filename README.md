# NDIS Invoicing

![build workflow badge](https://github.com/ianyeoh/ndis-invoicing/actions/workflows/docker-publish.yml/badge.svg)

A web-based tool to easily generate time-worked invoices for Australian NDIS support workers. All data is exported into Google Sheets using the Sheets API, authenticated with OAuth.

## Privacy Policy

This application is purely a frontend application. As such, none of your Google data stored, saved or sent outside your computer except to Google's own Drive and Sheets APIs that you authorise on your Google account. 
Only the Google Sheet spreadsheet you choose through the Google Drive picker is ever modified by this application.

## Configuration / Environment

The app reads its configuration from environment variables. Copy the example
file and fill in real values before running:

```bash
cp app/.env.example app/.env.local   # then edit app/.env.local
```

[`app/.env.example`](app/.env.example) documents every required and optional
variable with a one-line note each. The required set is `NEXTAUTH_SECRET`,
`GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and
`NEXT_PUBLIC_GOOGLE_PICKER_DEVELOPER_KEY`. The server validates these at request
time and fails fast with a clear error naming any that are missing, so a
misconfigured deployment surfaces immediately instead of failing deep inside the
OAuth flow.

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser; the others
(`NEXTAUTH_SECRET`, `GOOGLE_CLIENT_SECRET`) stay server-only and never reach the
client bundle. See [`SECURITY.md`](SECURITY.md) for the security posture,
including the client-side OAuth token trade-off.
