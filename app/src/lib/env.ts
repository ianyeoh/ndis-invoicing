/**
 * Server-side environment validation.
 *
 * Authentication and the Google Sheets/Drive integration cannot work unless
 * these variables are present. Validation runs lazily at request time (via
 * `assertServerEnv`) rather than at module import, so that `next build` can
 * complete without real secrets present - the build only needs the code to
 * load, not the runtime configuration. See `.env.example` for the full list.
 */

/** Environment variables that must be set for the server to function. */
const REQUIRED_SERVER_ENV = [
    // Signs/encrypts the NextAuth session JWT. Read implicitly by next-auth.
    "NEXTAUTH_SECRET",
    // Google OAuth client secret. Server-only; never sent to the browser.
    "GOOGLE_CLIENT_SECRET",
    // Google OAuth client id. Public (reaches the browser) but still required.
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    // Google Picker API developer key. Public but still required.
    "NEXT_PUBLIC_GOOGLE_PICKER_DEVELOPER_KEY",
] as const;

// Env vars are fixed for the process lifetime, so validate at most once.
let validated = false;

/**
 * Throws a clear error naming every missing required variable. Call this at
 * the start of a request handler - not at module scope - so the build stays
 * green without secrets. Blank values are treated as missing.
 */
export function assertServerEnv(): void {
    if (validated) return;

    const missing = REQUIRED_SERVER_ENV.filter((name) => {
        const value = process.env[name];
        return value === undefined || value.trim() === "";
    });

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variable(s): ${missing.join(", ")}. ` +
                `Copy .env.example to .env.local and set real values.`,
        );
    }

    validated = true;
}
